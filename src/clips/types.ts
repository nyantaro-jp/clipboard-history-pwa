export type Category = 'url' | 'email' | 'phone' | 'number' | 'code' | 'text'

export type ClipItem = {
  /** UUID */
  id: string
  /** 本文 */
  text: string
  /** 自動判定 or 手動設定 */
  category: Category
  tags: string[]
  pinned: boolean
  /** epoch ms */
  createdAt: number
  /** 重複保存時に更新する。一覧はこの値の新しい順に並べる */
  updatedAt: number
}
