import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works from any path, e.g. https://<user>.github.io/<repo>/
  base: './',
  // Only unit tests: tests/e2e holds Playwright specs, which run with `npm run e2e`.
  test: { include: ['tests/unit/**/*.test.ts'] },
});
