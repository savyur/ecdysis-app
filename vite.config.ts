import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base — путь на GitHub Pages: https://savyur.github.io/ecdysis-app/
export default defineConfig({
  base: '/ecdysis-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Экдизис — лист персонажа',
        short_name: 'Экдизис',
        lang: 'ru',
        display: 'standalone',
        background_color: '#E2D8BF',
        theme_color: '#E2D8BF',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
} as any);
