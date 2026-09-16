import { describe, expect, it } from 'vitest'
import { classifyText } from './classify'
import type { Category } from './types'

const cases: Record<Category, string[]> = {
  url: [
    'https://example.com',
    'http://localhost:5173/clipboard-history-pwa/?q=1#top',
    '  https://example.com/path  \n',
    'www.example.co.jp/page',
  ],
  email: ['someone@example.com', 'first.last+tag@mail.example.co.jp'],
  phone: ['090-1234-5678', '03 1234 5678', '09012345678', '+81 90-1234-5678', '(555) 123-4567', '０９０－１２３４－５６７８'],
  number: ['42', '-3.14', '1,234,567', '1234567890', '4111 1111 1111 1111', '2026-09-16', '090-1234', '１２３'],
  code: [
    'const x = foo(bar);',
    'function add(a, b) {\n  return a + b\n}',
    '<div class="item">text</div>',
    'if [ -f "$FILE" ]; then echo ok; fi',
  ],
  text: [
    '',
    'こんにちは',
    '今日は(晴れ)でした。明日は(雨)らしい',
    'He said "hello" to me',
    'メモ\n- 牛乳\n- 卵\n- パン',
    'https://example.com を見てください',
    'someone@example.com に連絡',
    'a = b',
    // 記号の比率で判定するため、記号の少ないコードは拾えない（既知の限界。手動で変更できる）
    'SELECT id\nFROM clips\nWHERE pinned',
  ],
}

describe('classifyText', () => {
  for (const [category, texts] of Object.entries(cases)) {
    for (const text of texts) {
      it(`${JSON.stringify(text)} は ${category}`, () => {
        expect(classifyText(text)).toBe(category)
      })
    }
  }
})
