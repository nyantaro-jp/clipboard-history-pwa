import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORY_LABELS } from './clips/categories'
import { countByCategory, filterClips, NO_FILTER, type ClipFilter } from './clips/filter'
import { describeReadFailure, readClipboardText } from './clips/readClipboard'
import { collectTags } from './clips/tags'
import type { ClipItem } from './clips/types'
import { useClips } from './clips/useClips'
import { BrowserModeNotice } from './components/BrowserModeNotice'
import { ClipListItem } from './components/ClipListItem'
import { ClipSheet } from './components/ClipSheet'
import { FilterBar } from './components/FilterBar'
import { Toast } from './components/Toast'
import { useToast } from './components/useToast'
import { getDisplayMode } from './lib/displayMode'
import { describeStorageError, requestPersistentStorage } from './lib/storage'
import './App.css'

export function App() {
  const { items, loading, loadError, saveText, update, remove, restore } = useClips()
  const { toast, show, dismiss } = useToast()
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<ClipFilter>(NO_FILTER)
  // 項目そのものではなく id を持ち、カテゴリやタグを変えたらシートにも最新の内容を映す
  const [sheetItemId, setSheetItemId] = useState<string | null>(null)
  const isStandalone = getDisplayMode() === 'standalone'

  useEffect(() => {
    void requestPersistentStorage()
  }, [])

  const allTags = useMemo(() => collectTags(items), [items])
  const counts = useMemo(() => countByCategory(items), [items])
  // 選択中のタグが全項目から消えたら、絞り込みも解除されたものとして扱う
  const activeTag = filter.tag !== null && allTags.includes(filter.tag) ? filter.tag : null
  const activeFilter = useMemo(() => ({ category: filter.category, tag: activeTag }), [filter.category, activeTag])
  const visibleItems = useMemo(() => filterClips(items, activeFilter), [items, activeFilter])
  const sheetItem = items.find((item) => item.id === sheetItemId) ?? null

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
        // 絞り込み中だと保存した項目が見えないことがあるため、解除して先頭に表示する
        setFilter(NO_FILTER)
        show({
          kind: 'info',
          text:
            outcome.kind === 'created'
              ? `保存しました（${CATEGORY_LABELS[outcome.item.category]}）`
              : '直前と同じ内容のため、日時を更新しました',
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

  const handleChange = useCallback(
    (next: ClipItem) => {
      update(next).catch((error: unknown) =>
        show({ kind: 'error', text: `変更を保存できませんでした（${describeStorageError(error)}）` }),
      )
    },
    [update, show],
  )

  const openSheet = useCallback((item: ClipItem) => setSheetItemId(item.id), [])
  const closeSheet = useCallback(() => setSheetItemId(null), [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>クリップ履歴</h1>
        <span className="count">{items.length} 件</span>
        {items.length > 0 && (
          <FilterBar filter={activeFilter} total={items.length} counts={counts} tags={allTags} onChange={setFilter} />
        )}
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
        {items.length > 0 && visibleItems.length === 0 && (
          <div className="empty">
            <p>条件に合う履歴がありません。</p>
            <button type="button" className="text-button" onClick={() => setFilter(NO_FILTER)}>
              絞り込みを解除
            </button>
          </div>
        )}
        <ul className="clip-list">
          {visibleItems.map((item) => (
            <ClipListItem key={item.id} item={item} onCopy={handleCopy} onOpenMenu={openSheet} />
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

      <ClipSheet
        item={sheetItem}
        allTags={allTags}
        onClose={closeSheet}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onChange={handleChange}
      />
    </div>
  )
}
