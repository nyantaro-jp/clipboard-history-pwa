import { useCallback, useEffect, useState } from 'react'

export type ToastMessage = {
  id: number
  kind: 'info' | 'error'
  text: string
  action?: { label: string; run: () => void }
}

const INFO_DURATION_MS = 3000
const ACTION_DURATION_MS = 6000

let nextId = 1

/**
 * 画面下部に出す通知を1件だけ管理する。
 * エラーは読み逃さないよう自動では消さず、利用者が閉じるか次の通知で置き換わるまで残す。
 */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const show = useCallback((message: Omit<ToastMessage, 'id'>) => {
    setToast({ ...message, id: nextId++ })
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast || toast.kind === 'error') return
    const timer = window.setTimeout(
      () => setToast((current) => (current?.id === toast.id ? null : current)),
      toast.action ? ACTION_DURATION_MS : INFO_DURATION_MS,
    )
    return () => window.clearTimeout(timer)
  }, [toast])

  return { toast, show, dismiss }
}
