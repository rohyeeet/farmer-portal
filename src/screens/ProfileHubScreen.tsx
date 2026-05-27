'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  CreditCard,
  IdCard,
  LogOut,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import packageJson from '../../package.json'
import { useAuth } from '../auth/useAuth'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { PageHeader } from '../components/shell/PageHeader'
import {
  IdentityVerificationStatusCard,
  type IdentityStatusRow,
} from '../components/profile/IdentityVerificationStatusCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PageLoading } from '../components/ui/PageLoading'
import { useDynamicTranslation } from '../i18n/useDynamicTranslation'
import { summarizeVerificationStatuses } from '../utils/verificationSummary'

function prettyRegion(value: string | undefined | null): string {
  if (!value) return ''
  const cleaned = value.replace(/_/g, ' ').trim().toLowerCase()
  return cleaned.replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

export default function ProfileHubScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()
  const { logout } = useAuth()
  const router = useRouter()

  const farmerProfile = bootstrap?.farmerProfile
  const translatedBlock = useDynamicTranslation(prettyRegion(farmerProfile?.region.block))
  const translatedDistrict = useDynamicTranslation(prettyRegion(farmerProfile?.region.district))
  const translatedState = useDynamicTranslation(prettyRegion(farmerProfile?.region.state))

  const [nationalIdOpen, setNationalIdOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [personalOpen, setPersonalOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  if (!bootstrap || !farmerProfile) {
    return <PageLoading />
  }

  const { ekycStatus, nationalIdDocumentStatus, bavStatus, bankAccountDocumentStatus } = bootstrap
  const ekycHref = '/profile/national-id/'
  const bavHref = '/profile/bank-verification/'
  const regionLine =
    [translatedBlock, translatedDistrict, translatedState]
      .filter((s) => s && s !== '—')
      .join(' · ') || '—'

  const initial = (farmerProfile.name?.trim()?.[0] ?? 'F').toUpperCase()
  const farmerId = String(bootstrap.farmerId)

  const nationalIdSummary = summarizeVerificationStatuses([
    ekycStatus,
    nationalIdDocumentStatus,
  ])
  const bankSummary = summarizeVerificationStatuses([bavStatus, bankAccountDocumentStatus])

  const nationalIdRows: IdentityStatusRow[] = [
    { labelKey: 'status_ekyc_api', hintKey: 'status_ekyc_api_hint', status: ekycStatus },
    {
      labelKey: 'status_national_id_document',
      hintKey: 'status_national_id_document_hint',
      status: nationalIdDocumentStatus,
    },
  ]

  const bankRows: IdentityStatusRow[] = [
    { labelKey: 'status_bav_api', hintKey: 'status_bav_api_hint', status: bavStatus },
    {
      labelKey: 'status_bank_account_document',
      hintKey: 'status_bank_account_document_hint',
      status: bankAccountDocumentStatus,
    },
  ]

  const handleLogout = () => {
    logout()
    router.replace('/login/')
  }

  return (
    <div className="fp-screen">
      <PageHeader title={t('my_profile')} backHref="/" brandChip />

      <section className="fp-profile-card" aria-labelledby="profile-name">
        <span className="fp-profile-card__avatar" aria-hidden>
          {farmerProfile.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={farmerProfile.profilePhotoUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--fp-color-text-subtle)' }}>
              {initial}
            </span>
          )}
          <span className="fp-profile-card__avatar-badge">
            <ShieldCheck size={12} strokeWidth={3} />
          </span>
        </span>
        <h2 id="profile-name" className="fp-profile-card__name">
          {farmerProfile.name}
        </h2>
        <p className="fp-profile-card__phone">{farmerProfile.mobileNumber || '—'}</p>
        <span className="fp-pill fp-profile-card__id">
          {t('farmer_id_prefix')}-{farmerId}
        </span>
      </section>

      <div className="fp-section">
        <h3 className="fp-section__title">{t('identity_status')}</h3>
      </div>
      <div className="fp-identity-list">
        <ExpandableRow
          icon={<CreditCard size={20} />}
          tone="lavender"
          title={t('national_id')}
          sub={t('ekyc_helper')}
          expanded={nationalIdOpen}
          onToggle={() => setNationalIdOpen((v) => !v)}
          trailing={<StatusBadge status={nationalIdSummary} />}
          expandedContent={
            <div className="fp-identity-row__verification-panel">
              <IdentityVerificationStatusCard rows={nationalIdRows} embedded />
              <Link href={ekycHref} className="fp-identity-row__detail-link">
                {t('view_full_details')}
              </Link>
            </div>
          }
        />
        <ExpandableRow
          icon={<CreditCard size={20} />}
          tone="amber"
          title={t('bank_verification')}
          sub={t('bav_helper')}
          expanded={bankOpen}
          onToggle={() => setBankOpen((v) => !v)}
          trailing={<StatusBadge status={bankSummary} />}
          expandedContent={
            <div className="fp-identity-row__verification-panel">
              <IdentityVerificationStatusCard rows={bankRows} embedded />
              <Link href={bavHref} className="fp-identity-row__detail-link">
                {t('view_full_details')}
              </Link>
            </div>
          }
        />
      </div>

      <div className="fp-section">
        <h3 className="fp-section__title">{t('account_privacy')}</h3>
      </div>
      <div className="fp-identity-list">
        <ExpandableRow
          icon={<IdCard size={20} />}
          tone="sage"
          title={t('personal_details')}
          sub={
            <>
              <MapPin size={12} aria-hidden /> {regionLine}
            </>
          }
          subVariant="content"
          expanded={personalOpen}
          onToggle={() => setPersonalOpen((v) => !v)}
          expandedContent={
            <dl className="fp-identity-row__details">
              <div>
                <dt>{t('mobile_number')}</dt>
                <dd>{farmerProfile.mobileNumber || '—'}</dd>
              </div>
              <div>
                <dt>{t('location')}</dt>
                <dd>{regionLine}</dd>
              </div>
              <div>
                <dt>{t('farmer_id')}</dt>
                <dd>
                  {t('farmer_id_prefix')}-{farmerId}
                </dd>
              </div>
            </dl>
          }
        />
        <ExpandableRow
          icon={<ShieldCheck size={20} />}
          tone="sage"
          title={t('terms_signed')}
          sub={t('verified')}
          expanded={termsOpen}
          onToggle={() => setTermsOpen((v) => !v)}
          expandedContent={
            <p className="fp-identity-row__details-text">{t('terms_signed_text')}</p>
          }
        />
      </div>

      <button
        type="button"
        className="fp-btn fp-btn--ghost"
        onClick={handleLogout}
        style={{ marginTop: 'var(--fp-space-4)' }}
      >
        <LogOut size={16} aria-hidden />
        {t('logout')}
      </button>
      <p className="fp-screen__footer-hint">
        {t('app_version')} · v{packageJson.version}
      </p>
    </div>
  )
}

function ExpandableRow({
  icon,
  tone,
  title,
  sub,
  subVariant = 'label',
  expanded,
  onToggle,
  trailing,
  expandedContent,
}: {
  icon: React.ReactNode
  tone: 'lavender' | 'amber' | 'rose' | 'sage'
  title: string
  sub: React.ReactNode
  subVariant?: 'label' | 'content'
  expanded: boolean
  onToggle: () => void
  trailing?: React.ReactNode
  expandedContent: React.ReactNode
}) {
  return (
    <div
      className={`fp-identity-row fp-identity-row--expandable${expanded ? ' fp-identity-row--expanded' : ''}`}
    >
      <button
        type="button"
        className="fp-identity-row__head"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className={`fp-tile-icon fp-tile-icon--${tone}`} aria-hidden>
          {icon}
        </span>
        <div className="fp-identity-row__body">
          <p className="fp-identity-row__title">{title}</p>
          <p
            className={`fp-identity-row__sub${subVariant === 'content' ? ' fp-identity-row__sub--content' : ''}`}
          >
            {sub}
          </p>
        </div>
        {trailing ? <span className="fp-identity-row__trailing">{trailing}</span> : null}
        <ChevronDown
          size={20}
          className={`fp-identity-row__chev${expanded ? ' fp-identity-row__chev--open' : ''}`}
          aria-hidden
        />
      </button>
      {expanded ? <div className="fp-identity-row__panel">{expandedContent}</div> : null}
    </div>
  )
}
