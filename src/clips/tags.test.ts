import { describe, expect, it } from 'vitest'
import { addTags, collectTags, MAX_TAG_LENGTH, normalizeTag, removeTag, suggestTags } from './tags'
import type { ClipItem } from './types'

const item = (tags: string[]): ClipItem => ({
  id: crypto.randomUUID(),
  text: 'x',
  category: 'text',
  tags,
  pinned: false,
  createdAt: 0,
  updatedAt: 0,
})

describe('normalizeTag', () => {
  it('前後の空白・先頭の #・全角英数字をそろえる', () => {
    expect(normalizeTag('  #仕事  ')).toBe('仕事')
    expect(normalizeTag('＃ＡＰＩ　キー')).toBe('API キー')
  })

  it('長すぎるタグは切り詰める', () => {
    expect(normalizeTag('あ'.repeat(50))).toHaveLength(MAX_TAG_LENGTH)
  })
})

describe('addTags / removeTag', () => {
  it('区切り文字で複数追加し、空や重複は無視する', () => {
    expect(addTags(['仕事'], '買い物、 #仕事, ,旅行')).toEqual(['仕事', '買い物', '旅行'])
  })

  it('指定したタグだけを外す', () => {
    expect(removeTag(['a', 'b', 'c'], 'b')).toEqual(['a', 'c'])
  })
})

describe('collectTags', () => {
  it('使用件数の多い順、同数なら名前順に並べる', () => {
    expect(collectTags([item(['b', 'a']), item(['a']), item(['c'])])).toEqual(['a', 'b', 'c'])
  })
})

describe('suggestTags', () => {
  const all = ['仕事', 'pass', 'API', 'shopping', '仕事メモ']

  it('付与済みのタグは候補に出さない', () => {
    expect(suggestTags(all, ['仕事'], '')).toEqual(['pass', 'API', 'shopping', '仕事メモ'])
  })

  it('前方一致を部分一致より先に、大文字小文字を区別せずに返す', () => {
    expect(suggestTags(all, [], 'p')).toEqual(['pass', 'API', 'shopping'])
    expect(suggestTags(all, [], '仕事')).toEqual(['仕事', '仕事メモ'])
  })
})
