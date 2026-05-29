import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 인라인 postcss(빈 플러그인)로 Tailwind v4 postcss.config.mjs 자동 로드를 우회한다
  // (순수 로직 단위 테스트는 CSS 처리가 불필요).
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'node',
    // lib 순수 로직만 — e2e/*.spec.ts(Playwright)는 제외한다.
    include: ['lib/**/*.test.ts'],
  },
});
