import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index-svelte.html',
      },
    },
  },
  server: {
    open: '/index-svelte.html',
    port: 5173,
  },
}); 