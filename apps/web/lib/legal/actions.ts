'use server';

import { legalDocumentPublishSchema, uuidSchema, type LegalDocumentPublishInput } from '@flowhr/schemas';
import type { Database } from '@flowhr/types';
import { isIP } from 'node:net';
import { headers } from 'next/headers';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ConsentSource = Database['public']['Enums']['consent_source'];

export type ConsentResult =
  | { ok: true }
  | { ok: false; error: 'unauthenticated' | 'not_found' | 'failed' };

export type PublishResult =
  | { ok: true }
  | { ok: false; error: 'forbidden' | 'duplicate_version' | 'invalid' | 'failed' };

/**
 * x-forwarded-for 첫 홉을 inet 컬럼(user_consents.ip_address)에 넣을 수 있는 값으로 정규화.
 * 유효 IPv4/IPv6 형식이 아니면 null (Vercel 엣지가 x-forwarded-for를 정규화 — KI-078 노트).
 */
function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get('x-forwarded-for');
  const raw = forwarded ? forwarded.split(',')[0]!.trim() : (headerList.get('x-real-ip')?.trim() ?? '');
  // inet 컬럼 — node:net 으로 엄격 검증(유효 IPv4/IPv6 만). 그 외엔 null.
  return raw && isIP(raw) !== 0 ? raw : null;
}

/**
 * 본인 약관 동의 기록 (POST /me/consents, ST-078 AC-3).
 * type/version 은 document_id 로 서버가 재조회해 결정한다(클라이언트 위조 방지).
 * ip/ua/source 도 서버에서 채운다. 이미 동의한 문서면 멱등(ON CONFLICT DO NOTHING).
 */
export async function recordConsent(
  documentId: string,
  source: ConsentSource = 'forced',
): Promise<ConsentResult> {
  if (!uuidSchema.safeParse(documentId).success) return { ok: false, error: 'not_found' };

  const profile = await getSessionProfile();
  if (!profile) return { ok: false, error: 'unauthenticated' };

  const supabase = await createSupabaseServerClient();
  // 활성 여부는 read RLS(is_active=true)로 보장 — 비활성 문서는 일반 사용자에게 보이지 않는다.
  const { data: doc } = await supabase
    .from('legal_documents')
    .select('type, version')
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) return { ok: false, error: 'not_found' };

  const headerList = await headers();
  const { error } = await supabase.from('user_consents').upsert(
    {
      user_id: profile.user.id,
      tenant_id: profile.tenantId,
      document_id: documentId,
      document_type: doc.type,
      version: doc.version,
      source,
      ip_address: clientIp(headerList),
      user_agent: headerList.get('user-agent'),
    },
    { onConflict: 'user_id,document_id', ignoreDuplicates: true },
  );
  if (error) {
    console.error('recordConsent failed', error);
    return { ok: false, error: 'failed' };
  }
  return { ok: true };
}

/**
 * 운영사(operator_super) 약관 신규 버전 게시 (POST /operator/legal/documents, ST-078 AC-4/AC-6).
 * ko/en 페어 동시 게시(스키마 강제). is_active=true 로 INSERT 하면 단일-active 트리거가
 * 기존 (type, language) active 를 자동 false 전환한다. 사용자(operator_super) 세션으로 실행 —
 * RLS legal_docs_insert/update(is_operator_super) 가 실제 방어선이고 앱 레이어 role 체크는 이중 확인(R1).
 */
export async function publishLegalDocuments(input: LegalDocumentPublishInput): Promise<PublishResult> {
  const parsed = legalDocumentPublishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const profile = await getSessionProfile();
  if (!profile || profile.role !== 'operator_super') return { ok: false, error: 'forbidden' };

  const { type, version, effectiveDate, ko, en } = parsed.data;
  const publishedAt = new Date().toISOString();
  const rows = (['ko', 'en'] as const).map((language) => {
    const content = language === 'ko' ? ko : en;
    return {
      type,
      version,
      language,
      effective_date: effectiveDate ?? null,
      title: content.title,
      content_md: content.contentMd,
      summary_md: content.summaryMd ?? null,
      is_active: true,
      published_by: profile.user.id,
      published_at: publishedAt,
    };
  });

  // 사용자(operator_super) 세션 client 로 게시 → RLS legal_docs_insert(is_operator_super) 가 실제
  // 방어선이 된다(앱 레이어 role 체크는 빠른 실패용 이중 확인). ensure_single_active 트리거의
  // 내부 UPDATE 도 동일 세션 권한으로 RLS legal_docs_update 를 통과한다.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('legal_documents').insert(rows);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'duplicate_version' };
    console.error('publishLegalDocuments failed', error);
    return { ok: false, error: 'failed' };
  }
  return { ok: true };
}
