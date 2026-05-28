import { QueryClient } from '@tanstack/react-query';

/** FlowHR 기본 TanStack Query 클라이언트 (전역 기본값). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
