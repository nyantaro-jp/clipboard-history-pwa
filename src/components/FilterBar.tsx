import { CATEGORY_LABELS, CATEGORY_ORDER } from '../clips/categories'
import type { ClipFilter } from '../clips/filter'
import type { Category } from '../clips/types'

type Props = {
  filter: ClipFilter
  total: number
  counts: Record<Category, number>
  tags: readonly string[]
  onChange: (filter: ClipFilter) => void
}

/** カテゴリ（1つ選択）とタグ（1つ選択）の絞り込みチップ。どちらも選択中のものを押すと解除する */
export function FilterBar({ filter, total, counts, tags, onChange }: Props) {
  return (
    <nav className="filter-bar" aria-label="絞り込み">
      <div className="chip-row" role="group" aria-label="カテゴリ">
        <button
          type="button"
          className="chip"
          aria-pressed={filter.category === null}
          onClick={() => onChange({ ...filter, category: null })}
        >
          すべて <span className="chip-count">{total}</span>
        </button>
        {CATEGORY_ORDER.map((category) => (
          <button
            key={category}
            type="button"
            className="chip"
            aria-pressed={filter.category === category}
            disabled={counts[category] === 0 && filter.category !== category}
            onClick={() => onChange({ ...filter, category: filter.category === category ? null : category })}
          >
            {CATEGORY_LABELS[category]} <span className="chip-count">{counts[category]}</span>
          </button>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="chip-row" role="group" aria-label="タグ">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="chip chip-tag"
              aria-pressed={filter.tag === tag}
              onClick={() => onChange({ ...filter, tag: filter.tag === tag ? null : tag })}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
