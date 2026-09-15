import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { decideSave, type SaveOutcome } from './saveClip'
import type { Category, ClipItem } from './types'

const DB_NAME = 'clipboard-history'
const DB_VERSION = 1

interface ClipsSchema extends DBSchema {
  clips: {
    key: string
    value: ClipItem
    indexes: {
      createdAt: number
      updatedAt: number
      category: Category
    }
  }
}

export type ClipsDb = IDBPDatabase<ClipsSchema>

export function openClipsDb(name = DB_NAME): Promise<ClipsDb> {
  return openDB<ClipsSchema>(name, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('clips', { keyPath: 'id' })
      store.createIndex('createdAt', 'createdAt')
      // 一覧の並び順と「直前の項目」の特定に使う
      store.createIndex('updatedAt', 'updatedAt')
      store.createIndex('category', 'category')
    },
  })
}

/** 新しい順（updatedAt の降順）で全件を返す */
export async function getAllClips(db: ClipsDb): Promise<ClipItem[]> {
  const items = await db.getAllFromIndex('clips', 'updatedAt')
  return items.reverse()
}

/**
 * 本文を保存する。直前の項目との重複判定と書き込みを1つのトランザクションで行い、
 * 連続タップで判定と書き込みの間に別の保存が割り込まないようにする。
 */
export async function saveClipText(db: ClipsDb, text: string, now = Date.now()): Promise<SaveOutcome> {
  const tx = db.transaction('clips', 'readwrite')
  const cursor = await tx.store.index('updatedAt').openCursor(null, 'prev')
  const outcome = decideSave(text, cursor?.value, now)
  // トランザクション中に IndexedDB 以外の await を挟むと自動コミットされるため、ここまで同期で進める
  await tx.store.put(outcome.item)
  await tx.done
  return outcome
}

export async function putClip(db: ClipsDb, item: ClipItem): Promise<void> {
  await db.put('clips', item)
}

export async function deleteClip(db: ClipsDb, id: string): Promise<void> {
  await db.delete('clips', id)
}
