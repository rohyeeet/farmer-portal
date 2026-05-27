'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OnboardingStepLayout } from '../../components/onboarding/OnboardingStepLayout'
import { Toast } from '../../components/ui/Toast'
import { useBootstrap } from '../../bootstrap/BootstrapProvider'
import { postBankVerification } from '../../services/onboardingApi'
import { onboardingContextFromBootstrap } from '../../services/bootstrapService'
import { clearOnboardingBank } from '../../utils/onboardingDraft'
import { hasBankAccountOnRecord } from '../../utils/onboardingPrerequisites'
import { ApiError } from '../../services/http/ApiError'

const schema = z
  .object({
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Enter a valid IFSC code'),
    accountNumber: z.string().regex(/^\d{6,20}$/, 'Numeric only (6–20 digits)'),
    reEnteredAccountNumber: z.string().regex(/^\d{6,20}$/, 'Numeric only'),
  })
  .refine((d) => d.accountNumber === d.reEnteredAccountNumber, {
    message: 'Account numbers must match',
    path: ['reEnteredAccountNumber'],
  })

type FormValues = z.infer<typeof schema>

export default function BavFormScreen() {
  const { t } = useTranslation()
  const { bootstrap, refresh } = useBootstrap()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpdate = searchParams.get('mode') === 'update'
  const [passbookFile, setPassbookFile] = useState<File | null>(null)
  const [passbookError, setPassbookError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const hasBankOnFile = bootstrap ? hasBankAccountOnRecord(bootstrap) : false
  const showRegisteredRef = hasBankOnFile && !isUpdate
  const maskedRef = bootstrap?.maskedBankAccountNumber ?? '•••• •••• ••••'
  const bankName = bootstrap?.bankName?.trim() || t('bav_form_default_bank')
  const defaultIfsc = bootstrap?.bankIfscCode?.trim().toUpperCase() ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      ifscCode: defaultIfsc,
      accountNumber: '',
      reEnteredAccountNumber: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setToast(null)
    setPassbookError(null)
    if (isUpdate && !passbookFile) {
      setPassbookError(t('upload_passbook'))
      return
    }
    if (!bootstrap) return
    try {
      const ctx = onboardingContextFromBootstrap(bootstrap)
      const res = await postBankVerification(ctx, {
        bankAccountNumber: data.accountNumber,
        ifscCode: data.ifscCode.toUpperCase(),
      })
      const matches = res.data?.matchesRegisteredAccount ?? res.data?.matches_registered_account ?? res.matchesRegisteredAccount ?? res.matches_registered_account
      if (showRegisteredRef && matches === false) {
        router.replace('/onboarding/bav-mismatch/')
        return
      }
      clearOnboardingBank()
      await refresh()
      router.replace('/onboarding/success/')
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : t('error_generic'))
    }
  }

  return (
    <OnboardingStepLayout
      backHref={isUpdate ? '/onboarding/bav-mismatch/' : '/onboarding/bav-intro/'}
      footer={
        <button
          type="submit"
          form="bav-form"
          className="fp-btn fp-btn--primary fp-btn--lg"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? t('loading') : isUpdate ? t('submit_bank') : t('verify_account')}
        </button>
      }
    >
      {toast ? <Toast tone="danger" message={toast} onDismiss={() => setToast(null)} /> : null}

      <header style={{ display: 'grid', gap: 'var(--fp-space-1)' }}>
        <h1 className="fp-ekyc-header__title">{t('bank_details')}</h1>
        <p className="fp-ekyc-header__sub">
          {isUpdate
            ? t('bav_form_update_help')
            : showRegisteredRef
              ? t('bav_form_existing_help', { bank: bankName })
              : t('bav_form_enter_help')}
        </p>
      </header>

      <form id="bav-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {showRegisteredRef ? (
          <div className="fp-form-field">
            <label className="fp-label" htmlFor="ref-acc">
              {t('registered_account_ref')}
            </label>
            <input
              id="ref-acc"
              className="fp-input fp-input--readonly fp-input--mono"
              readOnly
              tabIndex={-1}
              value={maskedRef}
            />
            <p className="fp-help">{t('must_match_last_4')}</p>
          </div>
        ) : null}
        <div className="fp-form-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--fp-space-1)' }}>
            <label className="fp-label" htmlFor="ifsc" style={{ marginBottom: 0 }}>
              {t('ifsc_code')}
            </label>
            {defaultIfsc ? (
              <span className="fp-status fp-status--accepted" style={{ fontSize: '0.7rem' }}>
                <span className="fp-status__dot" aria-hidden><Check size={11} strokeWidth={3} /></span>
                {t('auto_filled')}
              </span>
            ) : null}
          </div>
          <input
            id="ifsc"
            className="fp-input"
            autoCapitalize="characters"
            placeholder="SBIN0001234"
            aria-invalid={errors.ifscCode ? 'true' : 'false'}
            {...register('ifscCode')}
          />
          {defaultIfsc && !errors.ifscCode ? <p className="fp-help">{t('ifsc_auto_filled')}</p> : null}
          {errors.ifscCode ? <p className="fp-error">{errors.ifscCode.message}</p> : null}
        </div>
        <div className="fp-form-field">
          <label className="fp-label" htmlFor="acc">
            {t('account_number')}
          </label>
          <input
            id="acc"
            className="fp-input fp-input--mono"
            inputMode="numeric"
            placeholder="•••• •••• ••••"
            aria-invalid={errors.accountNumber ? 'true' : 'false'}
            {...register('accountNumber')}
          />
          {errors.accountNumber ? (
            <p className="fp-error">{errors.accountNumber.message}</p>
          ) : null}
        </div>
        <div className="fp-form-field">
          <label className="fp-label" htmlFor="acc2">
            {t('re_enter_acc')}
          </label>
          <input
            id="acc2"
            className="fp-input"
            inputMode="numeric"
            placeholder={t('re_enter_acc_placeholder')}
            aria-invalid={errors.reEnteredAccountNumber ? 'true' : 'false'}
            {...register('reEnteredAccountNumber')}
          />
          {errors.reEnteredAccountNumber ? (
            <p className="fp-error">{errors.reEnteredAccountNumber.message}</p>
          ) : null}
        </div>
        {isUpdate ? (
          <div className="fp-form-field">
            <label className="fp-label" htmlFor="pb">
              {t('upload_passbook')}
            </label>
            <input
              id="pb"
              type="file"
              className="fp-input"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => {
                setPassbookFile(e.target.files?.[0] ?? null)
                setPassbookError(null)
              }}
            />
            {passbookError ? <p className="fp-error">{passbookError}</p> : null}
          </div>
        ) : null}
      </form>
    </OnboardingStepLayout>
  )
}
