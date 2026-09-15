import { describe, expect, it } from 'vitest'
import { formatClipTime } from './formatTime'

const now = new Date(2026, 8, 15, 21, 30).getTime()

describe('formatClipTime', () => {
  it('今日なら時刻だけ', () => {
    expect(formatClipTime(new Date(2026, 8, 15, 9, 5).getTime(), now)).toBe('9:05')
  })

  it('今年の別の日なら月日と時刻', () => {
    expect(formatClipTime(new Date(2026, 0, 3, 23, 59).getTime(), now)).toBe('1/3 23:59')
  })

  it('去年以前なら年月日', () => {
    expect(formatClipTime(new Date(2025, 11, 31, 12, 0).getTime(), now)).toBe('2025/12/31')
  })
})
