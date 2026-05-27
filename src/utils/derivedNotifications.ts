import type { FarmerBootstrap } from '../types/bootstrap.api'
import type { VerificationStatus } from '../types/verification.types'

export type AlertTone = 'success' | 'warn' | 'danger' | 'info'

export type DerivedAlert = {
  /** Stable id so a "mark as read" state survives re-renders. */
  id: string
  tone: AlertTone
  titleKey: string
  textKey: string
  /** Translation timeAgo key; helper produces the value. */
  ageMinutes: number
  /** Where to send the user when they tap "Fix Now". `null` = no CTA. */
  fixHref: string | null
}

function ekycAlerts(status: VerificationStatus): DerivedAlert[] {
  switch (status) {
    case 'REJECTED':
      return [{
        id: 'ekyc-rejected',
        tone: 'danger',
        titleKey: 'notif_ekyc_rejected_title',
        textKey: 'notif_ekyc_rejected_msg',
        ageMinutes: 90,
        fixHref: '/onboarding/ekyc-intro/',
      }]
    case 'PENDING':
    case 'IN_PROGRESS':
      return [{
        id: 'ekyc-progress',
        tone: 'warn',
        titleKey: 'notif_ekyc_in_progress_title',
        textKey: 'notif_ekyc_in_progress_msg',
        ageMinutes: 30,
        fixHref: null,
      }]
    case 'ACCEPTED':
      return [{
        id: 'ekyc-accepted',
        tone: 'success',
        titleKey: 'notif_ekyc_accepted_title',
        textKey: 'notif_ekyc_accepted_msg',
        ageMinutes: 60,
        fixHref: null,
      }]
    case 'MISSING':
    default:
      return [{
        id: 'ekyc-missing',
        tone: 'info',
        titleKey: 'notif_ekyc_missing_title',
        textKey: 'notif_ekyc_missing_msg',
        ageMinutes: 5,
        fixHref: '/onboarding/ekyc-intro/',
      }]
  }
}

function bavAlerts(status: VerificationStatus): DerivedAlert[] {
  switch (status) {
    case 'REJECTED':
      return [{
        id: 'bav-rejected',
        tone: 'danger',
        titleKey: 'notif_bav_rejected_title',
        textKey: 'notif_bav_rejected_msg',
        ageMinutes: 180,
        fixHref: '/profile/bank-verification/',
      }]
    case 'PENDING':
    case 'IN_PROGRESS':
      return [{
        id: 'bav-progress',
        tone: 'warn',
        titleKey: 'notif_bav_in_progress_title',
        textKey: 'notif_bav_in_progress_msg',
        ageMinutes: 240,
        fixHref: null,
      }]
    case 'ACCEPTED':
      return [{
        id: 'bav-accepted',
        tone: 'success',
        titleKey: 'notif_bav_accepted_title',
        textKey: 'notif_bav_accepted_msg',
        ageMinutes: 120,
        fixHref: null,
      }]
    case 'MISSING':
    default:
      return [{
        id: 'bav-missing',
        tone: 'info',
        titleKey: 'notif_bav_missing_title',
        textKey: 'notif_bav_missing_msg',
        ageMinutes: 10,
        fixHref: '/profile/bank-verification/',
      }]
  }
}

/**
 * Derive the alert list a farmer sees, given their bootstrap snapshot.
 *
 * Rules
 * - Always one alert per verification track (eKYC, BAV). Missing tracks emit
 *   an informational "do this next" item with a `Fix Now` CTA — never blank.
 * - When the farmer is fully verified, the per-track success items collapse
 *   into the single "identity confirmed" celebratory row at the top.
 * - When the farmer has only just confirmed identity (claim screen), surface
 *   the celebratory "profile confirmed" item.
 *
 * Ordering: most actionable first (`danger` > `warn` > `info` > `success`).
 */
export function deriveAlerts(bootstrap: FarmerBootstrap): DerivedAlert[] {
  const { ekycStatus, bavStatus, identityConfirmed } = bootstrap
  const fully =
    identityConfirmed && ekycStatus === 'ACCEPTED' && bavStatus === 'ACCEPTED'

  if (fully) {
    return [
      {
        id: 'fully-verified',
        tone: 'success',
        titleKey: 'notif_fully_verified_title',
        textKey: 'notif_fully_verified_msg',
        ageMinutes: 60,
        fixHref: null,
      },
    ]
  }

  const items: DerivedAlert[] = []
  if (identityConfirmed) {
    items.push({
      id: 'identity-confirmed',
      tone: 'success',
      titleKey: 'notif_identity_confirmed_title',
      textKey: 'notif_identity_confirmed_msg',
      ageMinutes: 240,
      fixHref: null,
    })
  }
  items.push(...ekycAlerts(ekycStatus))
  items.push(...bavAlerts(bavStatus))

  const toneRank: Record<AlertTone, number> = { danger: 0, warn: 1, info: 2, success: 3 }
  return items.sort((a, b) => toneRank[a.tone] - toneRank[b.tone])
}

export function formatRelativeTime(
  minutes: number,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  if (minutes < 1) return t('time_now')
  if (minutes < 60) return t('time_minutes_ago', { count: Math.max(1, Math.floor(minutes)) })
  if (minutes < 60 * 24) return t('time_hours_ago', { count: Math.floor(minutes / 60) })
  return t('time_days_ago', { count: Math.floor(minutes / (60 * 24)) })
}
