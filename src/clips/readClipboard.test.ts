import { afterEach, describe, expect, it, vi } from 'vitest'
import { readClipboardText } from './readClipboard'

function stubReadText(readText: () => Promise<string>) {
  vi.stubGlobal('navigator', { clipboard: { readText: vi.fn(readText) } })
}

afterEach(() => vi.unstubAllGlobals())

describe('readClipboardText', () => {
  it('本文をそのまま返す（前後の空白は保つ）', async () => {
    stubReadText(async () => '  hello\n')
    expect(await readClipboardText()).toEqual({ ok: true, text: '  hello\n' })
  })

  it('空文字列や空白のみは empty として扱う', async () => {
    stubReadText(async () => '')
    expect(await readClipboardText()).toEqual({ ok: false, reason: 'empty' })
    stubReadText(async () => ' \n\t')
    expect(await readClipboardText()).toEqual({ ok: false, reason: 'empty' })
  })

  it('NotAllowedError は denied になる', async () => {
    stubReadText(async () => {
      throw new DOMException('denied by user', 'NotAllowedError')
    })
    expect(await readClipboardText()).toMatchObject({ ok: false, reason: 'denied' })
  })

  it('それ以外の例外は unknown になる', async () => {
    stubReadText(async () => {
      throw new TypeError('boom')
    })
    expect(await readClipboardText()).toMatchObject({ ok: false, reason: 'unknown', detail: 'TypeError: boom' })
  })

  it('Clipboard API がなければ readText を呼ばず unsupported を返す', async () => {
    vi.stubGlobal('navigator', {})
    expect(await readClipboardText()).toEqual({ ok: false, reason: 'unsupported' })
  })

  it('readText() は同期的に呼ばれる（呼び出し前に await を挟まない）', () => {
    stubReadText(async () => 'x')
    void readClipboardText()
    expect(navigator.clipboard.readText).toHaveBeenCalledTimes(1)
  })
})
