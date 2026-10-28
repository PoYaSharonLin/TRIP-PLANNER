/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages 專案頁面在 https://<user>.github.io/<repo>/ 之下，
// base 需設成 /<repo>/。CI 會用 repo 名稱帶入 VITE_BASE；本機預設 '/'。
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '旅行行程',
        short_name: '行程',
        description: '在手機上看行程、拖曳排序、點一下劃掉，離線也能用。',
        lang: 'zh-Hant',
        theme_color: '#0f766e',
        background_color: '#0f766e',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
