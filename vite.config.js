import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import safeParser from 'postcss-safe-parser';

import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: true,
    watch: {
      ignored: ['**/public/r/**', '**/public/og/**']
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src',
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@content': path.resolve(__dirname, 'src/content'),
      '@tailwind': path.resolve(__dirname, 'src/tailwind'),
      '@ts-default': path.resolve(__dirname, 'src/ts-default'),
      '@ts-tailwind': path.resolve(__dirname, 'src/ts-tailwind'),
      'react-virtualized': 'react-virtualized/dist/commonjs'
    }
  },
  css: {
    postcss: {
      parser: safeParser
    }
  },
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        warn(warning);
      }
    }
  }
});
