const pad = (n: number) => String(n).padStart(2, '0')

/** 今日なら時刻だけ、今年なら月日と時刻、それ以前は年月日を返す */
export function formatClipTime(at: number, now: number = Date.now()): string {
  const date = new Date(at)
  const today = new Date(now)
  const time = `${date.getHours()}:${pad(date.getMinutes())}`

  if (date.toDateString() === today.toDateString()) return time
  if (date.getFullYear() === today.getFullYear()) return `${date.getMonth() + 1}/${date.getDate()} ${time}`
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}
