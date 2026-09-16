import { useEffect, useRef } from 'react'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../clips/categories'
import type { ClipItem } from '../clips/types'
import { TagEditor } from './TagEditor'

type Props = {
  item: ClipItem | null
  allTags: readonly string[]
  onClose: () => void
  onCopy: (item: ClipItem) => void
  onDelete: (item: ClipItem) => void
  onChange: (next: ClipItem) => void
}

/**
 * 項目ごとの操作シート（画面下から出る）。カテゴリとタグの変更はその場で保存する。
 * <dialog> の showModal() を使い、フォーカスの閉じ込めと Esc での close をブラウザに任せる。
 */
export function ClipSheet({ item, allTags, onClose, onCopy, onDelete, onChange }: Props) {
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
      onClose={(event) => {
        // close イベントは非同期に届く。閉じた直後に別の項目で開き直していたら、古いイベントとして無視する
        if (!event.currentTarget.open) onClose()
      }}
      onClick={(event) => {
        // シートの外側（::backdrop 部分）のタップで閉じる
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {item && (
        <div className="sheet-content">
          <p className="sheet-preview">{item.text}</p>

          <section className="sheet-section">
            <h2 className="sheet-heading">カテゴリ</h2>
            <div className="category-grid" role="group" aria-label="カテゴリ">
              {CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="chip"
                  aria-pressed={item.category === category}
                  onClick={() => {
                    if (item.category !== category) onChange({ ...item, category })
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </section>

          <section className="sheet-section">
            <h2 className="sheet-heading">タグ</h2>
            {/* 項目を切り替えたら入力途中の文字列を捨てる */}
            <TagEditor key={item.id} tags={item.tags} allTags={allTags} onChange={(tags) => onChange({ ...item, tags })} />
          </section>

          <button type="button" className="sheet-button" onClick={run(onCopy)}>
            コピー
          </button>
          <button type="button" className="sheet-button danger" onClick={run(onDelete)}>
            削除
          </button>
          <button type="button" className="sheet-button secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      )}
    </dialog>
  )
}
