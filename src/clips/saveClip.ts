import { classifyText } from './classify'
import type { ClipItem } from './types'

export type SaveOutcome =
  | { kind: 'created'; item: ClipItem }
  /** 直前の項目と本文が完全一致したため、新規作成せず日時だけ更新した */
  | { kind: 'touched'; item: ClipItem }

/**
 * 保存する内容と直前の項目から、新規作成か日時更新かを決める。
 * DB やクリップボードに触れない純粋関数にして、重複判定をテストしやすくしている。
 */
export function decideSave(
  text: string,
  latest: ClipItem | undefined,
  now: number,
  createId: () => string = () => crypto.randomUUID(),
): SaveOutcome {
  if (latest && latest.text === text) {
    // カテゴリやタグは手動で変更されている可能性があるので、日時以外は触らない
    return { kind: 'touched', item: { ...latest, updatedAt: now } }
  }
  return {
    kind: 'created',
    item: {
      id: createId(),
      text,
      category: classifyText(text),
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    },
  }
}
