import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 컴포넌트는 react-dom/server renderToStaticMarkup으로 정적 렌더 검증(jsdom 불요).
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.tsx'],
  },
});
