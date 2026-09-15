/// <reference types="vite-plugin-pwa/client" />

declare const __BUILD_TIME__: string

interface Navigator {
  /** iOS Safari 独自。ホーム画面から起動した場合に true */
  readonly standalone?: boolean
}
