import { memo, useState } from 'react'
import type { ClipItem } from '../clips/types'
import { formatClipTime } from '../lib/formatTime'
import { useLongPress } from '../lib/useLongPress'

type Props = {
  item: ClipItem
  onCopy: (item: ClipItem) => void
  onOpenMenu: (item: ClipItem) => void
}

/**
 * 3行を超えそうな本文にだけ「全文」ボタンを出す。
 * 実際の描画高さを測ると 1000 件でレイアウト計算が重くなるため、文字数と改行数で近似している。
 */
function mayOverflow(text: string): boolean {
  return text.length > 90 || text.split('\n').length > 3
}

export const ClipListItem = memo(function ClipListItem({ item, onCopy, onOpenMenu }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { handlers, consumeLongPress } = useLongPress(() => onOpenMenu(item))

  return (
    <li className="clip">
      <button
        type="button"
        className="clip-body"
        {...handlers}
        onClick={() => {
          if (consumeLongPress()) return
          onCopy(item)
        }}
      >
        <span className={expanded ? 'clip-text' : 'clip-text clamped'}>{item.text}</span>
        <span className="clip-meta">
          <time dateTime={new Date(item.updatedAt).toISOString()}>{formatClipTime(item.updatedAt)}</time>
          <span className="visually-hidden">。タップでコピー、長押しでメニュー</span>
        </span>
      </button>
      <div className="clip-side">
        <button type="button" className="icon-button" aria-label="メニューを開く" onClick={() => onOpenMenu(item)}>
          ⋯
        </button>
        {mayOverflow(item.text) && (
          <button
            type="button"
            className="text-button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? '閉じる' : '全文'}
          </button>
        )}
      </div>
    </li>
  )
})
