import { getDisplayMode } from './displayMode'

/**
 * 永続ストレージを要求する。
 * Phase 0 の検証では、ホーム画面から起動した場合だけ許可された（ブラウザタブでは false）。
 * ブラウザタブで要求しても意味がないので、standalone のときだけ呼ぶ。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (getDisplayMode() !== 'standalone') return false
  const storage = navigator.storage as StorageManager | undefined
  if (!storage?.persist) return false
  try {
    return (await storage.persisted()) || (await storage.persist())
  } catch {
    return false
  }
}

/** IndexedDB の例外を、利用者が対処を判断できる文言に変換する */
export function describeStorageError(error: unknown): string {
  const name = error instanceof DOMException || error instanceof Error ? error.name : ''
  switch (name) {
    case 'QuotaExceededError':
      return '端末の空き容量が不足しています'
    case 'InvalidStateError':
    case 'UnknownError':
      return 'ストレージにアクセスできません。プライベートブラウズでは保存できない場合があります'
    default:
      return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }
}
