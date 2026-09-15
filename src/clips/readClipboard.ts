export type ClipboardReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: ClipboardReadFailure; detail?: string }

/**
 * - empty: 空文字列（空白のみを含む）が返った。iOS では確認 UI を閉じた場合もこうなりうる
 * - denied: NotAllowedError。ユーザー操作の起点が失われた場合もここに入る
 * - unsupported: Clipboard API が使えない（非 Secure Context など）
 * - unknown: 上記以外の例外
 */
export type ClipboardReadFailure = 'empty' | 'denied' | 'unsupported' | 'unknown'

/**
 * クリップボードからテキストを読む。
 *
 * iOS ではタップから `await` を1つでも挟むと readText() が拒否される（Phase 0 で確認）。
 * そのため呼び出し側はクリックハンドラの先頭で、他の処理より前にこの関数を呼ぶこと。
 * この関数自身も readText() の呼び出しより前に await を置いていない。
 */
export function readClipboardText(): Promise<ClipboardReadResult> {
  if (typeof navigator.clipboard?.readText !== 'function') {
    return Promise.resolve({ ok: false, reason: 'unsupported' })
  }

  return navigator.clipboard.readText().then(
    (text): ClipboardReadResult => (text.trim() === '' ? { ok: false, reason: 'empty' } : { ok: true, text }),
    (error: unknown): ClipboardReadResult => {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return { ok: false, reason: 'denied', detail }
      }
      return { ok: false, reason: 'unknown', detail }
    },
  )
}

export function describeReadFailure(reason: ClipboardReadFailure): string {
  switch (reason) {
    case 'empty':
      return 'クリップボードが空か、貼り付けが許可されませんでした。表示された「ペースト」をタップしてください'
    case 'denied':
      return '貼り付けが許可されませんでした。もう一度保存ボタンを押し、「ペースト」をタップしてください'
    case 'unsupported':
      return 'この環境ではクリップボードを読み取れません'
    case 'unknown':
      return 'クリップボードの読み取りに失敗しました'
  }
}
