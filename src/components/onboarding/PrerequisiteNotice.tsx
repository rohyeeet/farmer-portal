'use client'

import { AlertTriangle } from 'lucide-react'

/** Inline alert when profile data is missing before an onboarding step. */
export function PrerequisiteNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="fp-prerequisite-notice"
      style={{
        display: 'flex',
        gap: 'var(--fp-space-3)',
        alignItems: 'flex-start',
        padding: 'var(--fp-space-4)',
        borderRadius: 'var(--fp-radius-md)',
        background: 'var(--fp-color-warning-bg)',
        border: '1px solid var(--fp-color-warning-border)',
        color: 'var(--fp-color-warning-text)',
        fontSize: 'var(--fp-text-sm)',
        lineHeight: 'var(--fp-leading-snug)',
      }}
    >
      <AlertTriangle size={18} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  )
}
