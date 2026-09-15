import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages のプロジェクトサイトは https://<user>.github.io/<repo>/ で配信されるため、
// base をリポジトリ名に合わせる。dev サーバーでも同じパスにして挙動差をなくす。
const REPO_NAME = 'clipboard-history-pwa'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Phase 0 の検証ページ。IndexedDB の長期残存を確認し終えるまで同一オリジンに残す
        verify: fileURLToPath(new URL('./verify.html', import.meta.url)),
      },
    },
  },
  define: {
    // 実機で「今どのビルドを見ているか」を確認するため (Service Worker のキャッシュ対策)
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'クリップ履歴',
        short_name: 'クリップ履歴',
        description: 'コピーしたテキストを端末内に保存・分類・検索する',
        lang: 'ja',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
