import type { ClipItem } from './types'

export const MAX_TAG_LENGTH = 30

/**
 * 入力されたタグを保存用の形にそろえる。
 * 全角英数字は半角に、連続する空白は1つにし、先頭の # は外す（「#仕事」と「仕事」を同じタグにする）。
 */
export function normalizeTag(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^#+\s*/, '')
    .slice(0, MAX_TAG_LENGTH)
    .trim()
}

/** 「,」や「、」で区切って複数のタグをまとめて追加できるようにする。既存と重複するものは足さない */
export function addTags(current: readonly string[], input: string): string[] {
  const next = [...current]
  for (const part of input.split(/[,、]/)) {
    const tag = normalizeTag(part)
    if (tag !== '' && !next.includes(tag)) next.push(tag)
  }
  return next
}

export function removeTag(current: readonly string[], tag: string): string[] {
  return current.filter((t) => t !== tag)
}

/** 全項目で使われているタグを、使われている件数の多い順に返す */
export function collectTags(items: readonly ClipItem[]): string[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, 'ja'))
    .map(([tag]) => tag)
}

/**
 * 入力中の文字列に合う既存タグを返す。前方一致を部分一致より先に並べる。
 * 未入力のときは、よく使うタグをそのまま候補にする。
 */
export function suggestTags(
  allTags: readonly string[],
  current: readonly string[],
  query: string,
  limit = 8,
): string[] {
  const candidates = allTags.filter((tag) => !current.includes(tag))
  const q = normalizeTag(query).toLowerCase()
  if (q === '') return candidates.slice(0, limit)

  const prefix = candidates.filter((tag) => tag.toLowerCase().startsWith(q))
  const partial = candidates.filter((tag) => !tag.toLowerCase().startsWith(q) && tag.toLowerCase().includes(q))
  return [...prefix, ...partial].slice(0, limit)
}
