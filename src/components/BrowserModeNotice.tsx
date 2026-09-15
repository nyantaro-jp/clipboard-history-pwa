import { useState } from 'react'

const DISMISSED_KEY = 'browser-mode-notice-dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * ブラウザのタブで開いたときの案内。
 * Phase 0 の検証で、永続ストレージが許可されるのはホーム画面から起動した場合だけだと分かったため表示する。
 */
export function BrowserModeNotice() {
  const [dismissed, setDismissed] = useState(readDismissed)
  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // 保存できなくても、この表示中に閉じられれば十分
    }
  }

  return (
    <aside className="notice">
      <p>
        ブラウザで開いています。履歴が自動で消えることがあるため、共有メニューの「ホーム画面に追加」から使うのがおすすめです。
      </p>
      <button type="button" className="icon-button" aria-label="案内を閉じる" onClick={dismiss}>
        ×
      </button>
    </aside>
  )
}
