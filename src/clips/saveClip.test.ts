import { describe, expect, it } from 'vitest'
import { decideSave } from './saveClip'
import type { ClipItem } from './types'

const existing: ClipItem = {
  id: 'a',
  text: 'hello',
  category: 'text',
  tags: ['memo'],
  pinned: true,
  createdAt: 1000,
  updatedAt: 2000,
}

describe('decideSave', () => {
  it('履歴が空なら新規作成する', () => {
    const outcome = decideSave('hello', undefined, 5000, () => 'new-id')
    expect(outcome).toEqual({
      kind: 'created',
      item: {
        id: 'new-id',
        text: 'hello',
        category: 'text',
        tags: [],
        pinned: false,
        createdAt: 5000,
        updatedAt: 5000,
      },
    })
  })

  it('直前の項目と完全一致なら updatedAt だけを更新し、他の値は保つ', () => {
    const outcome = decideSave('hello', existing, 5000)
    expect(outcome).toEqual({ kind: 'touched', item: { ...existing, updatedAt: 5000 } })
  })

  it('前後の空白や大文字小文字が違えば別の内容として新規作成する', () => {
    expect(decideSave('hello ', existing, 5000).kind).toBe('created')
    expect(decideSave('Hello', existing, 5000).kind).toBe('created')
  })
})
