'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react'
import {
  IdentityVerificationStatusCard,
  type IdentityStatusRow,
} from './IdentityVerificationStatusCard'
import type { VerificationStatus } from '../../types/verification.types'

export function IdentityDetailLayout({
  vault,
  statusRows,
  note,
  footer,
}: {
  vault: ReactNode
  statusRows: IdentityStatusRow[]
  note: { status: VerificationStatus; text: string } | null
  footer?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="fp-identity-detail">
      <div className="fp-identity-detail__stack">
        {vault}
        <section className="fp-identity-detail__statuses" aria-labelledby="identity-verification-heading">
          <h2 id="identity-verification-heading" className="fp-identity-detail__statuses-title">
            {t('verification_status')}
          </h2>
          <IdentityVerificationStatusCard rows={statusRows} embedded />
        </section>
      </div>

      {note ? <IdentityStatusNote status={note.status} text={note.text} /> : null}

      {footer ? <div className="fp-identity-detail__footer">{footer}</div> : null}
    </div>
  )
}

export function IdentityStatusNote({
  status,
  text,
}: {
  status: VerificationStatus
  text: string
}) {
  const isAccepted = status === 'ACCEPTED'
  const isRejected = status === 'REJECTED'
  const tone = isAccepted ? 'success' : isRejected ? 'danger' : 'neutral'
  const NoteIcon = isAccepted
    ? CheckCircle2
    : isRejected
      ? AlertTriangle
      : status === 'PENDING' || status === 'IN_PROGRESS'
        ? Clock
        : Info

  return (
    <div role="note" className={`fp-identity-detail__note fp-identity-detail__note--${tone}`}>
      <span className="fp-identity-detail__note-icon" aria-hidden>
        <NoteIcon size={16} strokeWidth={2.4} />
      </span>
      <p className="fp-identity-detail__note-text">{text}</p>
    </div>
  )
}

/** One contextual note — most urgent verification track first. */
export function pickIdentityDetailNote(
  tracks: Array<{ status: VerificationStatus; rejectionReason?: string | null; keys: Record<VerificationStatus, string> }>,
  t: (key: string) => string,
): { status: VerificationStatus; text: string } | null {
  const rank: Record<VerificationStatus, number> = {
    REJECTED: 0,
    MISSING: 1,
    IN_PROGRESS: 2,
    PENDING: 2,
    ACCEPTED: 3,
  }

  if (tracks.every((tr) => tr.status === 'ACCEPTED')) return null

  const sorted = [...tracks].sort((a, b) => rank[a.status] - rank[b.status])
  const focus = sorted[0]
  if (!focus) return null

  if (focus.status === 'REJECTED' && focus.rejectionReason?.trim()) {
    return { status: 'REJECTED', text: focus.rejectionReason.trim() }
  }

  return { status: focus.status, text: t(focus.keys[focus.status]) }
}
