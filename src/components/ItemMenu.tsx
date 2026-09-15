import { useEffect, useRef } from 'react'
import type { ClipItem } from '../clips/types'

type Props = {
  item: ClipItem | null
  onClose: () => void
  onCopy: (item: ClipItem) => void
  onDelete: (item: ClipItem) => void
}

/**
 * 項目ごとの操作メニュー（画面下から出るシート）。
 * <dialog> の showModal() を使い、フォーカスの閉じ込めと Esc での close をブラウザに任せる。
 */
export function ItemMenu({ item, onClose, onCopy, onDelete }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (item && !dialog.open) dialog.showModal()
    if (!item && dialog.open) dialog.close()
  }, [item])

  const run = (action: (target: ClipItem) => void) => () => {
    if (!item) return
    onClose()
    action(item)
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-label="項目の操作"
      onClose={onClose}
      onClick={(event) => {
        // シートの外側（::backdrop 部分）のタップで閉じる
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {item && (
        <div className="sheet-content">
          <p className="sheet-preview">{item.text}</p>
          <button type="button" className="sheet-button" onClick={run(onCopy)}>
            コピー
          </button>
          <button type="button" className="sheet-button danger" onClick={run(onDelete)}>
            削除
          </button>
          <button type="button" className="sheet-button secondary" onClick={onClose}>
            キャンセル
          </button>
        </div>
      )}
    </dialog>
  )
}
