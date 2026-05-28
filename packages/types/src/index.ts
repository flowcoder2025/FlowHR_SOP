export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database';

/** 모든 엔티티 공통 타임스탬프 컬럼. */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}
