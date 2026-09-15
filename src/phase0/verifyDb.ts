import type { DisplayMode } from './environment'

// Phase 0 専用の検証用 DB。本番の `clips` ストアとは DB 名を分けて干渉させない。
const DB_NAME = 'phase0-verify'
const STORE = 'records'

export type VerifyRecord = {
  id: number
  /** launch: 起動時に自動記録 / manual: ボタンで記録 / test: クリップボード検証の結果 */
  kind: 'launch' | 'manual' | 'test'
  displayMode: DisplayMode
  at: number
  detail: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = run(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export function addRecord(record: Omit<VerifyRecord, 'id'>): Promise<IDBValidKey> {
  return withStore('readwrite', (store) => store.add(record))
}

export function getAllRecords(): Promise<VerifyRecord[]> {
  return withStore('readonly', (store) => store.getAll() as IDBRequest<VerifyRecord[]>)
}

export function clearRecords(): Promise<undefined> {
  return withStore('readwrite', (store) => store.clear())
}
