import { useCallback, useEffect, useRef, useState } from 'react'
import { collectEnvironment, describeError, getDisplayMode, type EnvironmentReport } from './environment'
import { addRecord, clearRecords, getAllRecords, type VerifyRecord } from './verifyDb'
import './verify.css'

/**
 * Phase 0: iOS 実機でクリップボード API と IndexedDB の挙動を確かめるための検証ページ。
 * 結果はこの端末の IndexedDB に残し、Markdown にして README へ転記できるようにする。
 */
export function VerifyPage() {
  const [environment, setEnvironment] = useState<EnvironmentReport>([])
  const [records, setRecords] = useState<VerifyRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const launchRecorded = useRef(false)

  const reload = useCallback(async () => {
    try {
      const all = await getAllRecords()
      setRecords(all.sort((a, b) => b.at - a.at))
    } catch (e) {
      setError(`IndexedDB の読み込みに失敗: ${describeError(e)}`)
    }
  }, [])

  const record = useCallback(
    async (kind: VerifyRecord['kind'], detail: string) => {
      try {
        await addRecord({ kind, detail, at: Date.now(), displayMode: getDisplayMode() })
      } catch (e) {
        setError(`IndexedDB への書き込みに失敗: ${describeError(e)}`)
      }
      await reload()
    },
    [reload],
  )

  useEffect(() => {
    collectEnvironment().then(setEnvironment)
    // StrictMode の二重実行で起動記録が2件にならないようにする
    if (launchRecorded.current) return
    launchRecorded.current = true
    record('launch', '起動')
  }, [record])

  /**
   * `action` はクリックハンドラから同期的に呼ばれる。
   * readText() の前に await を挟むとユーザー操作起点の扱いが変わりうるため、
   * 計測開始以外の処理を前に置かないこと。
   */
  const runClipboardTest = async (label: string, action: () => Promise<string>) => {
    const startedAt = performance.now()
    let detail: string
    try {
      const result = await action()
      detail = `${label}: 成功 (${elapsed(startedAt)}) ${result}`
    } catch (e) {
      detail = `${label}: 失敗 (${elapsed(startedAt)}) ${describeError(e)}`
    }
    await record('test', detail)
  }

  const copyReport = () =>
    runClipboardTest('結果のコピー', async () => {
      await navigator.clipboard.writeText(toMarkdown(environment, records))
      return 'Markdown をクリップボードに書き込んだ'
    })

  const requestPersist = async () => {
    setBusy(true)
    try {
      const granted = await navigator.storage.persist()
      await record('test', `storage.persist(): ${granted}`)
      setEnvironment(await collectEnvironment())
    } catch (e) {
      await record('test', `storage.persist(): 失敗 ${describeError(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const clearAll = async () => {
    if (!window.confirm('この表示モードで保存された検証記録をすべて削除します')) return
    try {
      await clearRecords()
    } catch (e) {
      setError(`削除に失敗: ${describeError(e)}`)
    }
    await reload()
  }

  const oldest = records.at(-1)

  return (
    <main className="verify">
      <header>
        <h1>Phase 0 実機検証</h1>
        <p className="badge">{getDisplayMode() === 'standalone' ? 'ホーム画面 PWA' : 'ブラウザタブ'}</p>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2>1・2. 読み取り</h2>
        <p className="hint">
          テスト用の文字列をコピーしてから押す。確認 UI の出方と、「ペースト」を押さずに閉じた場合も試す。
        </p>
        <button onClick={() => runClipboardTest('readText()', async () => describeText(await navigator.clipboard.readText()))}>
          readText()
        </button>
        <button onClick={() => runClipboardTest('read()', readViaClipboardItems)}>read()</button>
        <button
          onClick={() =>
            runClipboardTest('1秒待ってから readText()', async () => {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              return describeText(await navigator.clipboard.readText())
            })
          }
        >
          1秒待ってから readText()
        </button>
      </section>

      <section>
        <h2>書き戻し</h2>
        <p className="hint">
          書き込み後に他アプリで貼り付けられるか確認する。続けて readText() を押し、自分で書き込んだ内容でも確認 UI
          が出るかも見る。
        </p>
        <button
          onClick={() =>
            runClipboardTest('writeText()', async () => {
              const text = `phase0 ${new Date().toISOString()}`
              await navigator.clipboard.writeText(text)
              return JSON.stringify(text)
            })
          }
        >
          writeText()
        </button>
      </section>

      <section>
        <h2>4. 永続性</h2>
        <p className="hint">
          起動のたびに自動で記録される。数日後に開いて、古い記録が残っているかを見る。
          {oldest && <strong> 最古の記録: {formatAge(oldest.at)}前</strong>}
        </p>
        <button onClick={() => record('manual', '手動記録')}>現在時刻を記録</button>
        <button onClick={requestPersist} disabled={busy}>
          storage.persist()
        </button>
      </section>

      <section>
        <h2>環境</h2>
        <dl>
          {environment.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>記録 ({records.length} 件)</h2>
        <div className="actions">
          <button onClick={copyReport}>Markdown でコピー</button>
          <button className="danger" onClick={clearAll}>
            全削除
          </button>
        </div>
        <ol className="records">
          {records.map((r) => (
            <li key={r.id}>
              <span className="meta">
                {new Date(r.at).toLocaleString('ja-JP')} / {r.displayMode} / {r.kind}
              </span>
              {r.detail}
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

async function readViaClipboardItems(): Promise<string> {
  const items = await navigator.clipboard.read()
  const parts = await Promise.all(
    items.map(async (item) => {
      const types = item.types.join(', ')
      if (!item.types.includes('text/plain')) return `[${types}]`
      const blob = await item.getType('text/plain')
      return `[${types}] ${describeText(await blob.text())}`
    }),
  )
  return `items=${items.length} ${parts.join(' / ')}`
}

/** 記録に本文を丸ごと残さないよう先頭だけにする */
function describeText(text: string): string {
  if (text === '') return '空文字列'
  const preview = text.length > 40 ? `${text.slice(0, 40)}…` : text
  return `length=${text.length} ${JSON.stringify(preview)}`
}

function elapsed(startedAt: number): string {
  return `${Math.round(performance.now() - startedAt)}ms`
}

function formatAge(at: number): string {
  const minutes = Math.floor((Date.now() - at) / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}日${hours}時間`
  if (hours > 0) return `${hours}時間${minutes % 60}分`
  return `${minutes}分`
}

function toMarkdown(environment: EnvironmentReport, records: VerifyRecord[]): string {
  const cell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ')
  return [
    `## Phase 0 検証結果 (${getDisplayMode()})`,
    '',
    '| 項目 | 値 |',
    '|---|---|',
    ...environment.map(([label, value]) => `| ${cell(label)} | ${cell(value)} |`),
    '',
    '| 日時 | 表示モード | 種別 | 内容 |',
    '|---|---|---|---|',
    ...records.map(
      (r) =>
        `| ${new Date(r.at).toLocaleString('ja-JP')} | ${r.displayMode} | ${r.kind} | ${cell(r.detail)} |`,
    ),
  ].join('\n')
}
