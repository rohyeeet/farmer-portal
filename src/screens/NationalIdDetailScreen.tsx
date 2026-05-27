'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { PageHeader } from '../components/shell/PageHeader'
import { PageLoading } from '../components/ui/PageLoading'
import {
  IdentityDetailLayout,
  pickIdentityDetailNote,
} from '../components/profile/IdentityDetailLayout'
import type { IdentityStatusRow } from '../components/profile/IdentityVerificationStatusCard'
import type { VerificationStatus } from '../types/verification.types'

function needsEkycAction(status: VerificationStatus): boolean {
  return status === 'MISSING' || status === 'REJECTED'
}

export default function NationalIdDetailScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()

  if (!bootstrap) return <PageLoading />

  const {
    ekycStatus,
    nationalIdDocumentStatus,
    maskedAadhaar,
    ekycRejectionReason,
    farmerProfile,
  } = bootstrap

  const masked = maskedAadhaar?.trim() || '—'
  const name = farmerProfile.name?.trim() || '—'
  const ctaHref = '/onboarding/ekyc-intro/'
  const ekycNeedsAction = needsEkycAction(ekycStatus)

  const statusRows: IdentityStatusRow[] = [
    {
      labelKey: 'status_ekyc_api',
      hintKey: 'status_ekyc_api_hint',
      status: ekycStatus,
    },
    {
      labelKey: 'status_national_id_document',
      hintKey: 'status_national_id_document_hint',
      status: nationalIdDocumentStatus,
    },
  ]

  const note = pickIdentityDetailNote(
    [
      {
        status: ekycStatus,
        rejectionReason: ekycRejectionReason,
        keys: {
          ACCEPTED: 'ekyc_api_note_accepted',
          REJECTED: 'ekyc_api_note_rejected',
          PENDING: 'ekyc_api_note_pending',
          IN_PROGRESS: 'ekyc_api_note_pending',
          MISSING: 'ekyc_api_note_missing',
        },
      },
      {
        status: nationalIdDocumentStatus,
        keys: {
          ACCEPTED: 'national_id_document_note_accepted',
          REJECTED: 'national_id_document_note_rejected',
          PENDING: 'national_id_document_note_pending',
          IN_PROGRESS: 'national_id_document_note_pending',
          MISSING: 'national_id_document_note_missing',
        },
      },
    ],
    t,
  )

  const footer = ekycNeedsAction ? (
    <Link href={ctaHref} className="fp-btn fp-btn--primary fp-btn--lg">
      {t(ekycStatus === 'REJECTED' ? 'retry_verification' : 'verify_identity')}
    </Link>
  ) : null

  return (
    <div className="fp-screen">
      <PageHeader title={t('national_id')} backHref="/profile/" brandChip />

      <IdentityDetailLayout
        statusRows={statusRows}
        note={note}
        footer={footer}
        vault={
          <section
            className="fp-identity-vault-card fp-identity-vault-card--aadhaar fp-identity-vault-card--in-stack"
            aria-label={t('national_id')}
          >
            <div className="fp-identity-vault-card__head">
              <span className="fp-identity-vault-card__eyebrow">
                <ShieldCheck size={14} aria-hidden />
                {t('national_id')}
              </span>
            </div>

            <div className="fp-identity-vault-card__identity-grid">
              <div>
                <p className="fp-identity-vault-card__field-label">{t('aadhaar_number_label')}</p>
                <p className="fp-identity-vault-card__mono">{masked}</p>
              </div>
              <div>
                <p className="fp-identity-vault-card__sub-label">{t('name_on_record')}</p>
                <p className="fp-identity-vault-card__name">{name}</p>
              </div>
            </div>

            <span className="fp-identity-vault-card__icon-box" aria-hidden>
              <CreditCard size={20} />
            </span>
          </section>
        }
      />
    </div>
  )
}
