// 루트 '.' 배럴은 클라이언트/서버 공용 안전 모듈만 노출.
// 서버 전용(createServerSupabaseClient / createServiceRoleClient)은 '@flowhr/api-client/server' 참조.
export { createBrowserSupabaseClient, type FlowHRSupabaseClient } from './client';
export { createQueryClient } from './query-client';
export { roleToRedirectPath, canAccessPath, type UserRole } from './auth';
