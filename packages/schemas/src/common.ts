import { z } from 'zod';

/** UUID v4 식별자. */
export const uuidSchema = z.string().uuid();

/** ISO 8601 타임스탬프 (timestamptz). */
export const isoTimestampSchema = z.string().datetime({ offset: true });

/** 모든 엔티티 공통 타임스탬프. */
export const timestampsSchema = z.object({
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
});

/** 목록 조회 공통 페이지네이션 쿼리. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
