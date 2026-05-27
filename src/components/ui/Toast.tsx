'use client'

import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'danger' | 'info'

const ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  danger: AlertTriangle,
  info: Info,
}

export function Toast({
  tone = 'info',
  message,
  onDismiss,
  autoHideMs = 4000,
}: {
  tone?: ToastTone
  message: string
  onDismiss?: () => void
  autoHideMs?: number
}) {
  useEffect(() => {
    if (!onDismiss || !autoHideMs) return
    const handle = window.setTimeout(onDismiss, autoHideMs)
    return () => window.clearTimeout(handle)
  }, [onDismiss, autoHideMs])

  const Icon = ICONS[tone]

  return (
    <div className={`fp-toast fp-toast--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden className="fp-toast__icon" />
      <p className="fp-toast__text">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className="fp-toast__close"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
