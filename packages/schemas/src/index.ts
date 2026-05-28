import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// zod에 .openapi() 메서드 확장 (모든 스키마 정의 전에 1회 호출).
extendZodWithOpenApi(z);

/**
 * 전역 OpenAPI 레지스트리. 엔티티/엔드포인트 스키마는 이 레지스트리에 등록하고
 * Sprint 1 Day 13~14의 build-openapi 스크립트가 dist/openapi.yaml로 출력한다.
 */
export const registry = new OpenAPIRegistry();

export { z };
export * from './common';
export * from './auth';
