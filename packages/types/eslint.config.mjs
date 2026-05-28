import base from '@flowhr/config/eslint-base';

// src/database.ts 는 supabase 자동 생성 파일 — lint 제외.
export default [{ ignores: ['src/database.ts'] }, ...base];
