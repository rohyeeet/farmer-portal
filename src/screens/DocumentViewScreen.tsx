'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Volume2 } from 'lucide-react'
import { PageHeader } from '../components/shell/PageHeader'
import { PageError } from '../components/ui/PageError'
import { PageLoading } from '../components/ui/PageLoading'
import { BrandMark } from '../components/brand/BrandMark'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { fetchFarmDocumentsByProject, getDocBucketCategory } from '../services/farmDocumentsApi'
import { canViewLegalDocument } from '../utils/documentGating'
import type { FarmProjectType } from '../types/farm.api'
import { DEFAULT_FARM_LIST_PROJECT_TYPE } from '../types/farm.api'
import { ApiError } from '../services/http/ApiError'

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'blocked'; titleKey: string }
  | { kind: 'not_generated'; titleKey: string }
  | { kind: 'not_found' }
  | { kind: 'ready'; url: string; titleKey: string; isConsent: boolean }

export default function DocumentViewScreen({ docId }: { docId: string }) {
  const { t, i18n } = useTranslation()
  const { bootstrap } = useBootstrap()
  const searchParams = useSearchParams()
  const farmId = Number(searchParams.get('farmId'))
  const projectType =
    (searchParams.get('projectType') as FarmProjectType) || DEFAULT_FARM_LIST_PROJECT_TYPE
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(farmId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase({ kind: 'error', message: t('error_generic') })
      return
    }
    let cancelled = false

    fetchFarmDocumentsByProject(projectType, farmId)
      .then((buckets) => {
        if (cancelled) return
        for (const b of buckets) {
          for (const d of b.docs) {
            if (String(d.id) === docId) {
              const isConsent = getDocBucketCategory(b.refSubType) === 'digital_consent'
              const gate = canViewLegalDocument(
                bootstrap?.ekycStatus ?? 'MISSING',
                d.verificationStatus,
                isConsent,
              )
              if (!gate.allowed) {
                setPhase({ kind: 'blocked', titleKey: b.label })
                return
              }
              if (!d.mediaUrl) {
                setPhase({ kind: 'not_generated', titleKey: b.label })
                return
              }
              setPhase({ kind: 'ready', url: d.mediaUrl, titleKey: b.label, isConsent })
              return
            }
          }
        }
        setPhase({ kind: 'not_found' })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const message = e instanceof ApiError ? e.message : t('error_generic')
        setPhase({ kind: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [farmId, projectType, docId, bootstrap?.ekycStatus, nonce, t])

  const backHref = Number.isFinite(farmId) ? `/farm/${farmId}/` : '/'
  const titleKey =
    phase.kind === 'ready' || phase.kind === 'blocked' || phase.kind === 'not_generated'
      ? phase.titleKey
      : null
  const title = titleKey ? t(titleKey) : t('document')

  const onSpeak = () => {
    if (phase.kind !== 'ready' || typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(`${title}. ${t('official_registry_copy')}`)
    const lang = i18n.language
    if (lang === 'hi') u.lang = 'hi-IN'
    else if (lang === 'kn') u.lang = 'kn-IN'
    else if (lang === 'ta') u.lang = 'ta-IN'
    else u.lang = 'en-IN'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const headerNode = (
    <span className="fp-brand-lockup">
      <span className="fp-brand-mark fp-brand-mark--sm" aria-hidden>
        <BrandMark size={14} />
      </span>
      <span>
        <span className="fp-brand-lockup__primary">{t('vault_brand')}</span>{' '}
        <span className="fp-brand-lockup__secondary">{t('vault_title').toUpperCase()}</span>
      </span>
    </span>
  )

  if (phase.kind === 'loading') {
    return (
      <div className="fp-screen">
        <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />
        <PageLoading inline />
      </div>
    )
  }

  if (phase.kind === 'error') {
    return (
      <div className="fp-screen">
        <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />
        <PageError message={phase.message} onRetry={() => setNonce((n) => n + 1)} />
      </div>
    )
  }

  if (phase.kind === 'blocked') {
    return (
      <div className="fp-screen">
        <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />
        <div className="fp-card fp-empty-state">
          <p className="fp-empty-state__title">{t('docs_locked')}</p>
          <p className="fp-empty-state__text">{t('verification_banner_ekyc_text')}</p>
          <Link href="/onboarding/ekyc-intro/" className="fp-btn fp-btn--primary">
            {t('verify_now')}
          </Link>
        </div>
      </div>
    )
  }

  if (phase.kind === 'not_generated') {
    return (
      <div className="fp-screen">
        <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />
        <div className="fp-card fp-empty-state">
          <p className="fp-empty-state__title">{t('document_not_generated')}</p>
          <p className="fp-empty-state__text">{t('ekyc_update_soon')}</p>
        </div>
      </div>
    )
  }

  if (phase.kind === 'not_found') {
    return (
      <div className="fp-screen">
        <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />
        <div className="fp-card fp-empty-state">
          <p className="fp-empty-state__title">{t('document_not_found')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fp-screen">
      <PageHeader titleNode={headerNode} subtitle={title.toUpperCase()} backHref={backHref} brandChip={false} />

      {phase.isConsent ? (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={onSpeak} className="fp-ai-summary">
            <Volume2 size={14} aria-hidden /> {t('ai_summary_speaker')}
          </button>
        </div>
      ) : null}

      <article className="fp-vault-card" aria-label={title}>
        <header className="fp-vault-card__head">
          <div>
            <h1 className="fp-vault-card__title">{title}</h1>
            <p className="fp-vault-card__sub">{t('official_registry_copy')}</p>
          </div>
          <span className="fp-vault-card__badge" aria-hidden>PDF</span>
        </header>

        <iframe
          src={phase.url}
          title={title}
          style={{
            width: '100%',
            height: '60vh',
            border: 'none',
            display: 'block',
            marginTop: 'var(--fp-space-4)',
            borderRadius: 'var(--fp-radius-md)',
            background: 'var(--fp-color-surface-muted)',
          }}
        />

        <div className="fp-vault-card__sig">
          <div>
            <p className="fp-vault-card__sig-label">{t('farmer_signature')}</p>
            <p className="fp-vault-card__sig-value">{t('signed_digitally')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="fp-vault-card__sig-label">{t('varaha_stamp')}</p>
            <span className="fp-brand-mark fp-brand-mark--lg" aria-hidden>
              <BrandMark size={22} />
            </span>
          </div>
        </div>

        <div className="fp-vault-card__footer">
          {t('verification_id', { id: `VRA-${docId}` })}
        </div>
      </article>
    </div>
  )
}
