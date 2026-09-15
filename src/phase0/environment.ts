import { getDisplayMode } from '../lib/displayMode'

export { getDisplayMode, type DisplayMode } from '../lib/displayMode'

export type EnvironmentReport = Array<[label: string, value: string]>

/** 検証結果の前提となる実行環境を収集する */
export async function collectEnvironment(): Promise<EnvironmentReport> {
  const clipboard = navigator.clipboard as Clipboard | undefined
  const storage = navigator.storage as StorageManager | undefined

  const report: EnvironmentReport = [
    ['ビルド', __BUILD_TIME__],
    ['User-Agent', navigator.userAgent],
    ['表示モード', getDisplayMode()],
    ['isSecureContext', String(window.isSecureContext)],
    ['clipboard.readText', String(typeof clipboard?.readText === 'function')],
    ['clipboard.read', String(typeof clipboard?.read === 'function')],
    ['clipboard.writeText', String(typeof clipboard?.writeText === 'function')],
    ['indexedDB', String(typeof indexedDB !== 'undefined')],
  ]

  try {
    report.push(['storage.persisted()', String(await storage?.persisted?.())])
    const estimate = await storage?.estimate?.()
    if (estimate) {
      report.push(['storage 使用量/上限', `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`])
    }
  } catch (error) {
    report.push(['StorageManager', `取得失敗: ${describeError(error)}`])
  }

  return report
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return '不明'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** DOMException は name が本体なので、name と message を両方残す */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}
