/**
 * zod 스키마 → OpenAPI 3.1 명세 자동 생성 (sprint-001 Day 13~14 / WI-021).
 *
 * 출력: packages/schemas/dist/openapi.yaml — API 계약 SSOT.
 *   phase7-code.yml 의 "OpenAPI 최신성" diff 게이트 대상이라 git 추적한다(.gitignore 예외).
 *   zod 스키마를 고치면 이 스크립트를 재실행(turbo build)하고 openapi.yaml 을 함께 커밋해야 한다.
 *
 * 엔드포인트/엔티티 스키마(39 엔티티 + ~280 endpoint)는 Sprint 2~6 에 registry 등록으로 점진 확장.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { stringify } from 'yaml';

import { registry } from '../src/index';
import { loginSchema } from '../src/auth';
import {
  uuidSchema,
  isoTimestampSchema,
  timestampsSchema,
  paginationQuerySchema,
} from '../src/common';

// ── 컴포넌트 스키마 등록 (Sprint 1: 인증 + 공통) ──────────────────────────────
registry.register('Login', loginSchema);
registry.register('Uuid', uuidSchema);
registry.register('IsoTimestamp', isoTimestampSchema);
registry.register('Timestamps', timestampsSchema);
registry.register('PaginationQuery', paginationQuerySchema);

const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'FlowHR API',
    version: '0.1.0',
    description:
      'FlowHR 멀티테넌트 HR SaaS API 명세. zod 스키마(@flowhr/schemas)에서 zod-to-openapi 로 자동 생성한다. 엔드포인트/엔티티 스키마는 Sprint 2~6 에 점진 확장.',
  },
});

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const outPath = resolve(outDir, 'openapi.yaml');
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, stringify(document), 'utf8');

console.log(
  `OpenAPI 3.1 명세 생성 완료 → ${outPath} (${registry.definitions.length} definitions)`,
);
