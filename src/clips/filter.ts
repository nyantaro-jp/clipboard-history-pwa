import type { Category, ClipItem } from './types'

export type ClipFilter = {
  /** null はすべてのカテゴリ */
  category: Category | null
  /** null はタグで絞り込まない */
  tag: string | null
}

export const NO_FILTER: ClipFilter = { category: null, tag: null }

/** カテゴリとタグの両方に当てはまる項目だけを、元の順のまま返す */
export function filterClips(items: readonly ClipItem[], filter: ClipFilter): ClipItem[] {
  return items.filter(
    (item) =>
      (filter.category === null || item.category === filter.category) &&
      (filter.tag === null || item.tags.includes(filter.tag)),
  )
}

export function countByCategory(items: readonly ClipItem[]): Record<Category, number> {
  const counts: Record<Category, number> = { url: 0, email: 0, phone: 0, number: 0, code: 0, text: 0 }
  for (const item of items) counts[item.category]++
  return counts
}
