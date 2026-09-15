export type DisplayMode = 'standalone' | 'browser'

/** ホーム画面から起動した PWA か、ブラウザのタブかを判定する */
export function getDisplayMode(): DisplayMode {
  if (navigator.standalone === true) return 'standalone'
  return window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
}
