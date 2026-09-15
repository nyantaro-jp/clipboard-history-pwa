import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// iOS のホーム画面アイコン (apple-touch-icon) は SVG 非対応のため、
// SVG 1枚から必要な PNG 群をビルド時に生成する。
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
