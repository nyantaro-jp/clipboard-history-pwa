import type { Category } from './types'

/** 絞り込みチップや選択肢に並べる順 */
export const CATEGORY_ORDER: readonly Category[] = ['url', 'email', 'phone', 'number', 'code', 'text']

export const CATEGORY_LABELS: Record<Category, string> = {
  url: 'URL',
  email: 'メール',
  phone: '電話',
  number: '数字',
  code: 'コード',
  text: 'テキスト',
}
