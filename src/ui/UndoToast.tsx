import { useEffect } from 'react'

type Props = {
  message: string
  onUndo: () => void
  onDismiss: () => void
  /** 幾毫秒後自動消失。 */
  timeoutMs?: number
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
  timeoutMs = 6000,
}: Props) {
  useEffect(() => {
    const id = setTimeout(onDismiss, timeoutMs)
    return () => clearTimeout(id)
  }, [onDismiss, timeoutMs])

  return (
    <div className="undo-toast" role="status">
      <span>{message}</span>
      <button type="button" className="link-btn" onClick={onUndo}>
        復原
      </button>
    </div>
  )
}
