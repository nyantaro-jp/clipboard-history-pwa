import { describe, expect, it } from 'vitest'
import { countByCategory, filterClips, NO_FILTER } from './filter'
import type { Category, ClipItem } from './types'

const clip = (id: string, category: Category, tags: string[] = []): ClipItem => ({
  id,
  text: id,
  category,
  tags,
  pinned: false,
  createdAt: 0,
  updatedAt: 0,
})

const items = [clip('1', 'url', ['仕事']), clip('2', 'text', ['仕事']), clip('3', 'url'), clip('4', 'code')]
const ids = (list: ClipItem[]) => list.map((c) => c.id)

describe('filterClips', () => {
  it('条件なしなら全件をそのままの順で返す', () => {
    expect(ids(filterClips(items, NO_FILTER))).toEqual(['1', '2', '3', '4'])
  })

  it('カテゴリとタグは AND で絞り込む', () => {
    expect(ids(filterClips(items, { category: 'url', tag: null }))).toEqual(['1', '3'])
    expect(ids(filterClips(items, { category: null, tag: '仕事' }))).toEqual(['1', '2'])
    expect(ids(filterClips(items, { category: 'url', tag: '仕事' }))).toEqual(['1'])
  })
})

describe('countByCategory', () => {
  it('件数のないカテゴリは 0 になる', () => {
    expect(countByCategory(items)).toEqual({ url: 2, email: 0, phone: 0, number: 0, code: 1, text: 1 })
  })
})
