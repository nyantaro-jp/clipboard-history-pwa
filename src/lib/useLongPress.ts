import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

const MOVE_TOLERANCE_PX = 10

/**
 * 長押しを検出する。スクロールや指の移動が始まったら取り消す。
 * 長押しが成立した後に続けて発生する click は `consumeLongPress()` で判別して無視する。
 */
export function useLongPress(onLongPress: () => void, delayMs = 500) {
  const timer = useRef<number | undefined>(undefined)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    startPoint.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  const handlers = {
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return
      cancel()
      fired.current = false
      startPoint.current = { x: event.clientX, y: event.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        startPoint.current = null
        onLongPress()
      }, delayMs)
    },
    onPointerMove: (event: PointerEvent) => {
      const start = startPoint.current
      if (!start) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE_PX) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // iOS の長押しで出るシステムメニューやデスクトップの右クリックメニューを抑止する
    onContextMenu: (event: MouseEvent) => event.preventDefault(),
  }

  const consumeLongPress = () => {
    const wasFired = fired.current
    fired.current = false
    return wasFired
  }

  return { handlers, consumeLongPress }
}
