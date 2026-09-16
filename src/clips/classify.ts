import type { Category } from './types'

const EMAIL = /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]{2,}$/i
const PHONE_CHARS = /^\+?[\d\s()-]+$/
const NUMBER = /^[+-]?\d[\d,.\s-]*$/
/** コードに多く、日本語や英語の文章にはあまり出ない記号。引用符は文章にも多いので含めない */
const CODE_SYMBOLS = /[{}[\]();=<>/\\|&$`]/g

/**
 * 本文からカテゴリを推定する。判定は上から順に行い、最初に当てはまったものを返す。
 * 全角の英数字や記号は NFKC で半角にそろえてから判定する（例: "０９０－１２３４－５６７８"）。
 */
export function classifyText(raw: string): Category {
  const text = raw.normalize('NFKC').trim()
  if (text === '') return 'text'

  const isSingleToken = !/\s/.test(text)
  if (isSingleToken && isUrl(text)) return 'url'
  if (isSingleToken && EMAIL.test(text)) return 'email'
  if (isPhone(text)) return 'phone'
  if (NUMBER.test(text)) return 'number'
  if (looksLikeCode(text)) return 'code'
  return 'text'
}

function isUrl(text: string): boolean {
  if (/^www\.[^.\s]+\.[^.\s]/i.test(text)) return true
  if (!/^https?:\/\//i.test(text)) return false
  return URL.canParse(text)
}

/**
 * 数字の桁数が 10〜15 で、先頭が + か 0、または括弧を含むものを電話番号とみなす。
 * 先頭が 0 以外で区切りのない長い数字（金額や ID）は number に回す。
 */
function isPhone(text: string): boolean {
  if (!PHONE_CHARS.test(text)) return false
  const digits = text.replace(/\D/g, '').length
  if (digits < 10 || digits > 15) return false
  return /^[+0]/.test(text) || /[()]/.test(text)
}

/**
 * 改行の有無と、記号の比率でコードらしさを判定する。
 * - 複数行: 記号が 10% 以上、またはインデントされた行があり記号が 5% 以上
 * - 1行: 記号が 15% 以上で、英数字が主体（括弧を含む日本語の文章を除くため）
 *
 * 記号の少ないコード（SQL など）は text になる。自動判定は手動で上書きできる前提で、誤判定より単純さを優先した
 */
function looksLikeCode(text: string): boolean {
  const compact = text.replace(/\s/g, '')
  if (compact.length < 8) return false

  const symbolRatio = (text.match(CODE_SYMBOLS)?.length ?? 0) / compact.length
  const lines = text.split('\n')

  if (lines.length >= 2) {
    const hasIndentedLine = lines.some((line) => /^( {2,}|\t)\S/.test(line))
    return symbolRatio >= 0.1 || (hasIndentedLine && symbolRatio >= 0.05)
  }

  const nonAsciiRatio = compact.replace(/[\x21-\x7e]/g, '').length / compact.length
  return symbolRatio >= 0.15 && nonAsciiRatio < 0.3
}
