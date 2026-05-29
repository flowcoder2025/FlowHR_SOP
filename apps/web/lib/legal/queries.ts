import 'server-only';
import type { Database } from '@flowhr/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LegalDocumentType = Database['public']['Enums']['legal_document_type'];

/** 활성 약관 1건 (CM-21 본문 렌더용). camelCase API 표기로 매핑. */
export interface ActiveLegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  language: string;
  effectiveDate: string | null;
  title: string | null;
  contentMd: string | null;
  summaryMd: string | null;
}

/** 강제 동의 필요 문서 (GET /me/consents/required 정합, ST-078 AC-2). */
export interface RequiredConsentItem {
  type: LegalDocumentType;
  documentId: string;
  version: string;
  language: string;
  title: string | null;
  effectiveDate: string | null;
  summaryMd: string | null;
}

const ACTIVE_COLS = 'id, type, version, language, effective_date, title, content_md, summary_md';

type ActiveRow = {
  id: string;
  type: LegalDocumentType;
  version: string;
  language: string;
  effective_date: string | null;
  title: string | null;
  content_md: string | null;
  summary_md: string | null;
};

function toActive(row: ActiveRow): ActiveLegalDocument {
  return {
    id: row.id,
    type: row.type,
    version: row.version,
    language: row.language,
    effectiveDate: row.effective_date,
    title: row.title,
    contentMd: row.content_md,
    summaryMd: row.summary_md,
  };
}

/**
 * 요청 언어 우선 + ko fallback으로 활성 약관 본문을 선택한다.
 * 법적 효력은 ko (i18n batch-005) — 요청 언어 버전이 없으면 ko로 폴백한다.
 * 비로그인도 조회 가능 (RLS legal_docs_read: is_active=true 공개).
 */
function pickByLanguage(rows: ActiveRow[], language: string): ActiveRow | null {
  if (rows.length === 0) return null;
  return rows.find((r) => r.language === language) ?? rows.find((r) => r.language === 'ko') ?? rows[0]!;
}

export async function getActiveLegalDocument(
  type: LegalDocumentType,
  language: string,
): Promise<ActiveLegalDocument | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('legal_documents')
    .select(ACTIVE_COLS)
    .eq('type', type)
    .eq('is_active', true);
  if (error || !data) return null;
  const row = pickByLanguage(data as ActiveRow[], language);
  return row ? toActive(row) : null;
}

/**
 * 현재 로그인 사용자가 아직 동의하지 않은 활성 약관(terms/privacy) 목록.
 * type별 사용자 locale 우선 문서 1건을 기준으로 user_consents(document_id) 동의 여부를 본다.
 * 신규 버전이 게시되면 새 document_id → 미동의 → 강제 동의 대상이 된다.
 */
export async function getRequiredConsents(locale: string): Promise<RequiredConsentItem[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: docs } = await supabase
    .from('legal_documents')
    .select(ACTIVE_COLS)
    .eq('is_active', true)
    .in('type', ['terms', 'privacy']);
  if (!docs || docs.length === 0) return [];

  const { data: consents } = await supabase
    .from('user_consents')
    .select('document_id')
    .eq('user_id', user.id);
  const consented = new Set((consents ?? []).map((c) => c.document_id));

  const required: RequiredConsentItem[] = [];
  for (const type of ['terms', 'privacy'] as const) {
    const forType = (docs as ActiveRow[]).filter((d) => d.type === type);
    const doc = pickByLanguage(forType, locale);
    if (doc && !consented.has(doc.id)) {
      required.push({
        type,
        documentId: doc.id,
        version: doc.version,
        language: doc.language,
        title: doc.title,
        effectiveDate: doc.effective_date,
        summaryMd: doc.summary_md,
      });
    }
  }
  return required;
}
