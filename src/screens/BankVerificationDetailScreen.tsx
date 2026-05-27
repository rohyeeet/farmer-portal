'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Building2, Landmark } from 'lucide-react'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { PageHeader } from '../components/shell/PageHeader'
import { PageLoading } from '../components/ui/PageLoading'
import {
  IdentityDetailLayout,
  pickIdentityDetailNote,
} from '../components/profile/IdentityDetailLayout'
import type { IdentityStatusRow } from '../components/profile/IdentityVerificationStatusCard'
import type { VerificationStatus } from '../types/verification.types'

function needsBavAction(status: VerificationStatus): boolean {
  return status === 'MISSING' || status === 'REJECTED'
}

export default function BankVerificationDetailScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()

  if (!bootstrap) return <PageLoading />

  const {
    bavStatus,
    bankAccountDocumentStatus,
    bavRejectionReason,
    maskedBankAccountNumber,
    bankIfscCode,
    bankName,
    farmerProfile,
  } = bootstrap

  const masked = maskedBankAccountNumber?.trim() || '•••• •••• ••••'
  const name = farmerProfile.name?.trim() || '—'
  const bankLabel = bankName?.trim() || t('bav_form_default_bank')
  const bavNeedsAction = needsBavAction(bavStatus)

  const statusRows: IdentityStatusRow[] = [
    {
      labelKey: 'status_bav_api',
      hintKey: 'status_bav_api_hint',
      status: bavStatus,
    },
    {
      labelKey: 'status_bank_account_document',
      hintKey: 'status_bank_account_document_hint',
      status: bankAccountDocumentStatus,
    },
  ]

  const note = pickIdentityDetailNote(
    [
      {
        status: bavStatus,
        rejectionReason: bavRejectionReason,
        keys: {
          ACCEPTED: 'bav_api_note_accepted',
          REJECTED: 'bav_api_note_rejected',
          PENDING: 'bav_api_note_pending',
          IN_PROGRESS: 'bav_api_note_pending',
          MISSING: 'bav_api_note_missing',
        },
      },
      {
        status: bankAccountDocumentStatus,
        keys: {
          ACCEPTED: 'bank_account_document_note_accepted',
          REJECTED: 'bank_account_document_note_rejected',
          PENDING: 'bank_account_document_note_pending',
          IN_PROGRESS: 'bank_account_document_note_pending',
          MISSING: 'bank_account_document_note_missing',
        },
      },
    ],
    t,
  )

  const footer = bavNeedsAction ? (
    <Link href="/onboarding/bav-intro/" className="fp-btn fp-btn--primary fp-btn--lg">
      {t(bavStatus === 'REJECTED' ? 'retry_verification' : 'verify_account')}
    </Link>
  ) : null

  return (
    <div className="fp-screen">
      <PageHeader title={t('bank_verification')} backHref="/profile/" brandChip />

      <IdentityDetailLayout
        statusRows={statusRows}
        note={note}
        footer={footer}
        vault={
          <section
            className="fp-identity-vault-card fp-identity-vault-card--bank fp-identity-vault-card--in-stack"
            aria-label={t('bank_verification')}
          >
            <div className="fp-identity-vault-card__head">
              <span className="fp-identity-vault-card__eyebrow">
                <Landmark size={14} aria-hidden />
                {t('bank_verification')}
              </span>
            </div>

            <div className="fp-identity-vault-card__identity-grid">
              <div>
                <p className="fp-identity-vault-card__field-label">{t('bank_account_label')}</p>
                <p className="fp-identity-vault-card__mono">{masked}</p>
              </div>
              <div>
                <p className="fp-identity-vault-card__sub-label">{t('bank_name_label')}</p>
                <p className="fp-identity-vault-card__name">{bankLabel}</p>
              </div>
            </div>

            <dl className="fp-identity-vault-card__meta">
              <div>
                <dt>{t('ifsc_code')}</dt>
                <dd>{bankIfscCode?.trim() || '—'}</dd>
              </div>
              <div>
                <dt>{t('name_on_record')}</dt>
                <dd>{name}</dd>
              </div>
            </dl>

            <span className="fp-identity-vault-card__icon-box" aria-hidden>
              <Building2 size={20} />
            </span>
          </section>
        }
      />
    </div>
  )
}
