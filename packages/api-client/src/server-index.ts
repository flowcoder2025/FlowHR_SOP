// 서버 전용 진입점 (@flowhr/api-client/server). server-only 가드가 있는 모듈만 노출하여
// 클라이언트 번들 유입을 차단한다. 루트 '.' 배럴에는 포함하지 않는다.
export { createServerSupabaseClient } from './server';
export { createServiceRoleClient } from './service-role';
