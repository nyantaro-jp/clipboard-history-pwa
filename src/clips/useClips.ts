import { useCallback, useEffect, useState } from 'react'
import { describeStorageError } from '../lib/storage'
import { deleteClip, getAllClips, openClipsDb, putClip, saveClipText, type ClipsDb } from './clipsDb'
import type { SaveOutcome } from './saveClip'
import type { ClipItem } from './types'

// 接続はアプリ全体で1つを使い回す。失敗した場合は次回の呼び出しで開き直す
let dbPromise: Promise<ClipsDb> | null = null
function getDb(): Promise<ClipsDb> {
  dbPromise ??= openClipsDb().catch((error: unknown) => {
    dbPromise = null
    throw error
  })
  return dbPromise
}

const byNewest = (a: ClipItem, b: ClipItem) => b.updatedAt - a.updatedAt

/**
 * 履歴の一覧と操作をまとめた hook。
 * IndexedDB を正とし、書き込みが成功してから画面の state を更新する。
 * 書き込みに失敗した場合は例外をそのまま投げ、呼び出し側で理由を表示する。
 */
export function useClips() {
  const [items, setItems] = useState<ClipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getDb()
      .then(getAllClips)
      .then((all) => {
        if (!cancelled) setItems(all)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(`履歴を読み込めませんでした（${describeStorageError(error)}）`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const saveText = useCallback(async (text: string): Promise<SaveOutcome> => {
    const outcome = await saveClipText(await getDb(), text)
    // 保存した項目は updatedAt が最新なので先頭に来る
    setItems((prev) => [outcome.item, ...prev.filter((item) => item.id !== outcome.item.id)])
    return outcome
  }, [])

  const remove = useCallback(async (target: ClipItem): Promise<void> => {
    await deleteClip(await getDb(), target.id)
    setItems((prev) => prev.filter((item) => item.id !== target.id))
  }, [])

  /** 削除の取り消し用。削除前の内容をそのまま書き戻す */
  const restore = useCallback(async (target: ClipItem): Promise<void> => {
    await putClip(await getDb(), target)
    setItems((prev) => [...prev.filter((item) => item.id !== target.id), target].sort(byNewest))
  }, [])

  return { items, loading, loadError, saveText, remove, restore }
}
