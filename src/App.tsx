import { useCallback, useEffect, useState } from 'react'
import { describeReadFailure, readClipboardText } from './clips/readClipboard'
import type { ClipItem } from './clips/types'
import { useClips } from './clips/useClips'
import { BrowserModeNotice } from './components/BrowserModeNotice'
import { ClipListItem } from './components/ClipListItem'
import { ItemMenu } from './components/ItemMenu'
import { Toast } from './components/Toast'
import { useToast } from './components/useToast'
import { getDisplayMode } from './lib/displayMode'
import { describeStorageError, requestPersistentStorage } from './lib/storage'
import './App.css'

export function App() {
  const { items, loading, loadError, saveText, remove, restore } = useClips()
  const { toast, show, dismiss } = useToast()
  const [saving, setSaving] = useState(false)
  const [menuItem, setMenuItem] = useState<ClipItem | null>(null)
  const isStandalone = getDisplayMode() === 'standalone'

  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  const handleSave = () => {
    // iOS ではタップから await を挟むと読み取りが拒否されるため、何よりも先に呼ぶ
    const reading = readClipboardText()
    setSaving(true)
    void (async () => {
      try {
        const result = await reading
        if (!result.ok) {
          show({ kind: 'error', text: describeReadFailure(result.reason) })
          return
        }
        const outcome = await saveText(result.text)
        show({
          kind: 'info',
          text: outcome.kind === 'created' ? '保存しました' : '直前と同じ内容のため、日時を更新しました',
        })
      } catch (error) {
        show({ kind: 'error', text: `保存できませんでした（${describeStorageError(error)}）` })
      } finally {
        setSaving(false)
      }
    })()
  }

  const handleCopy = useCallback(
    (item: ClipItem) => {
      navigator.clipboard.writeText(item.text).then(
        () => show({ kind: 'info', text: 'コピーしました' }),
        (error: unknown) =>
          show({ kind: 'error', text: `コピーできませんでした（${error instanceof Error ? error.name : error}）` }),
      )
    },
    [show],
  )

  const handleDelete = useCallback(
    async (item: ClipItem) => {
      try {
        await remove(item)
      } catch (error) {
        show({ kind: 'error', text: `削除できませんでした（${describeStorageError(error)}）` })
        return
      }
      show({
        kind: 'info',
        text: '削除しました',
        action: {
          label: '元に戻す',
          run: () =>
            restore(item).catch((error: unknown) =>
              show({ kind: 'error', text: `元に戻せませんでした（${describeStorageError(error)}）` }),
            ),
        },
      })
    },
    [remove, restore, show],
  )

  const closeMenu = useCallback(() => setMenuItem(null), [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>クリップ履歴</h1>
        <span className="count">{items.length} 件</span>
      </header>

      {!isStandalone && <BrowserModeNotice />}

      <main className="app-main">
        {loadError && (
          <p className="load-error" role="alert">
            {loadError}
          </p>
        )}
        {!loading && !loadError && items.length === 0 && (
          <div className="empty">
            <p>まだ履歴がありません。</p>
            <p>テキストをコピーしてから、下のボタンをタップしてください。</p>
          </div>
        )}
        <ul className="clip-list">
          {items.map((item) => (
            <ClipListItem key={item.id} item={item} onCopy={handleCopy} onOpenMenu={setMenuItem} />
          ))}
        </ul>
        <p className="footnote">
          <a href="verify.html">Phase 0 実機検証ページ</a>
        </p>
      </main>

      <Toast toast={toast} onDismiss={dismiss} />

      <footer className="save-bar">
        <button type="button" className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? '読み取り中…' : 'クリップボードから保存'}
        </button>
      </footer>

      <ItemMenu item={menuItem} onClose={closeMenu} onCopy={handleCopy} onDelete={handleDelete} />
    </div>
  )
}
