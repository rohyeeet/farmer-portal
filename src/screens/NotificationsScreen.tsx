'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  Info,
  UserRoundPlus,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../components/shell/PageHeader'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import {
  deriveAlerts,
  formatRelativeTime,
  type AlertTone,
} from '../utils/derivedNotifications'

const READ_STORAGE_KEY = 'fp_alerts_read_v1'

const TONE_ICON: Record<AlertTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  warn: Clock,
  danger: XCircle,
  info: Info,
}

function loadReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.sessionStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr.filter((v): v is string => typeof v === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* quota — silent */
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReadIds(loadReadIds())
    setHydrated(true)
  }, [])

  const alerts = useMemo(() => (bootstrap ? deriveAlerts(bootstrap) : []), [bootstrap])
  const unreadCount = useMemo(
    () => alerts.reduce((acc, a) => (readIds.has(a.id) ? acc : acc + 1), 0),
    [alerts, readIds],
  )

  const markAllRead = () => {
    const next = new Set<string>(readIds)
    for (const a of alerts) next.add(a.id)
    setReadIds(next)
    saveReadIds(next)
  }

  return (
    <div className="fp-screen">
      <PageHeader title={t('alerts')} backHref="/" brandChip />

      {alerts.length > 0 ? (
        <div className="fp-row-between" style={{ marginBottom: 'var(--fp-space-2)' }}>
          <span className="fp-section__title">{t('recent_alerts')}</span>
          <button
            type="button"
            className="fp-text-link-strong"
            onClick={markAllRead}
            disabled={!hydrated || unreadCount === 0}
            aria-disabled={!hydrated || unreadCount === 0}
          >
            {unreadCount === 0 ? t('all_read') : t('mark_all_read')}
          </button>
        </div>
      ) : null}

      {alerts.length === 0 ? (
        <div className="fp-card fp-empty-state">
          <Inbox size={36} aria-hidden color="var(--fp-color-text-subtle)" />
          <p className="fp-empty-state__title">{t('no_alerts')}</p>
          <p className="fp-empty-state__text">{t('no_alerts_help')}</p>
        </div>
      ) : (
        <div className="fp-card-stack">
          {alerts.map((a) => {
            const Icon = TONE_ICON[a.tone]
            const isRead = readIds.has(a.id)
            return (
              <article
                key={a.id}
                className={`fp-notif-row fp-notif-row--${a.tone}${isRead ? ' fp-notif-row--read' : ''}`}
                aria-label={t(a.titleKey)}
              >
                <span className="fp-notif-row__icon" aria-hidden>
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <div className="fp-notif-row__body">
                  <p className="fp-notif-row__title">{t(a.titleKey)}</p>
                  <p className="fp-notif-row__time">{formatRelativeTime(a.ageMinutes, t)}</p>
                </div>
                <ChevronRight size={18} className="fp-notif-row__chev" aria-hidden />
                <p className="fp-notif-row__text">{t(a.textKey)}</p>
                {a.fixHref ? (
                  <Link href={a.fixHref} className="fp-btn fp-btn--dark fp-notif-row__cta">
                    <UserRoundPlus size={16} aria-hidden /> {t('fix_now')}
                  </Link>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
