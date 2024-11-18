import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
  },
  server: {
    open: false,
    port: 5173,
  },
});