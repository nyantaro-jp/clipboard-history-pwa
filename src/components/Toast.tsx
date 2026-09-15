import type { ToastMessage } from './useToast'

type Props = {
  toast: ToastMessage | null
  onDismiss: () => void
}

export function Toast({ toast, onDismiss }: Props) {
  return (
    // 読み上げのため、領域自体は常に置いておき中身だけを差し替える
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : undefined}>
          <p className="toast-text">{toast.text}</p>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action?.run()
                onDismiss()
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" className="toast-close" aria-label="通知を閉じる" onClick={onDismiss}>
            ×
          </button>
        </div>
      )}
    </div>
  )
}
