import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deleteClip, getAllClips, openClipsDb, putClip, saveClipText, type ClipsDb } from './clipsDb'
import type { ClipItem } from './types'

function clip(id: string, updatedAt: number): ClipItem {
  return { id, text: id, category: 'text', tags: [], pinned: false, createdAt: updatedAt, updatedAt }
}

let db: ClipsDb

beforeEach(async () => {
  db = await openClipsDb(`test-${crypto.randomUUID()}`)
})

afterEach(() => db.close())

describe('clipsDb', () => {
  it('updatedAt の新しい順に返す', async () => {
    await putClip(db, clip('old', 1))
    await putClip(db, clip('new', 3))
    await putClip(db, clip('mid', 2))

    expect((await getAllClips(db)).map((c) => c.id)).toEqual(['new', 'mid', 'old'])
  })

  it('直前の項目と同じ本文を保存すると、件数は増えず日時だけ更新される', async () => {
    const first = await saveClipText(db, 'hello', 1000)
    const second = await saveClipText(db, 'hello', 2000)

    expect(first.kind).toBe('created')
    expect(second).toEqual({ kind: 'touched', item: { ...first.item, updatedAt: 2000 } })
    expect(await getAllClips(db)).toEqual([second.item])
  })

  it('直前ではない項目と同じ本文なら新規作成する', async () => {
    await saveClipText(db, 'A', 1000)
    await saveClipText(db, 'B', 2000)
    const outcome = await saveClipText(db, 'A', 3000)

    expect(outcome.kind).toBe('created')
    expect((await getAllClips(db)).map((c) => c.text)).toEqual(['A', 'B', 'A'])
  })

  it('delete で消える', async () => {
    await putClip(db, clip('a', 1))
    await deleteClip(db, 'a')
    expect(await getAllClips(db)).toEqual([])
  })
})
