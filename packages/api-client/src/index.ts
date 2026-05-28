// 루트 '.' 배럴은 클라이언트/서버 공용 안전 모듈만 노출.
// 서버 전용(createServerSupabaseClient / createServiceRoleClient)은 '@flowhr/api-client/server' 참조.
export { createBrowserSupabaseClient, type FlowHRSupabaseClient } from './client';
export { createQueryClient } from './query-client';
export { roleToRedirectPath, canAccessPath, type UserRole } from './auth';
// Realtime 구독 wrapper/훅은 React 클라이언트 모듈('use client')이라 '@flowhr/api-client/react' 서브패스로 분리.
// (루트 배럴은 서버 컴포넌트에서도 import되므로 React 훅 모듈을 포함하지 않는다.)
