import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  vite: {
    server: {
      watch: {
        ignored: ['**/execution-query-tool/**'],
      },
    },
  },
});
