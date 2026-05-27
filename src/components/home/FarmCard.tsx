'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Trees } from 'lucide-react'
import type { FarmCardModel } from '../../types/bootstrap.api'
import type { VerificationStatus } from '../../types/verification.types'
import { persistFarmDetailNav } from '../../types/farmDetailNav'
import { normalizeFarmRow } from '../farm-list/farmListNormalize'
import { useDynamicTranslation } from '../../i18n/useDynamicTranslation'
import { fetchFarmDocumentsByProject } from '../../services/farmDocumentsApi'
import { fetchKyaarisForFarm } from '../../services/kyaariApi'
import {
  type CardStatus,
  computeCraConsentStatus,
  computeFarmEligibility,
} from '../../utils/farmCardStatusCompute'

type StatusTone = 'accepted' | 'pending' | 'rejected' | 'default'

const ELIGIBILITY_TONE: Record<CardStatus, StatusTone> = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
  MISSING: 'default',
}

const ELIGIBILITY_LABEL: Record<CardStatus, string> = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
  MISSING: 'missing',
}

/* Consent (CRA) is a generated artefact, so the listing collapses to:
   "Generated" when ACCEPTED, "Yet to generate" otherwise. */
function consentTone(status: CardStatus): StatusTone {
  return status === 'ACCEPTED' ? 'accepted' : 'default'
}

function consentLabelKey(status: CardStatus): string {
  return status === 'ACCEPTED' ? 'generated' : 'yet_to_generate'
}

export function FarmCard({
  card,
  raw,
  idStatus,
}: {
  card: FarmCardModel
  raw: unknown
  idStatus: VerificationStatus
}) {
  const { t } = useTranslation()
  const row = normalizeFarmRow(raw, card.projectTypeRaw)
  const href = `/farm/${card.farmId}/?projectType=${card.projectTypeRaw}`
  // Farm names are proper nouns; skip dynamic translation.
  const farmName = useDynamicTranslation(card.farmName, { skip: true })

  // Both queries run in parallel; React Query dedupes if the same farm
  // is rendered elsewhere (e.g. Farm Detail) within the staleTime window.
  const docsQuery = useQuery({
    queryKey: ['farm-docs', card.projectTypeRaw, card.farmId],
    queryFn: () => fetchFarmDocumentsByProject(card.projectTypeRaw, card.farmId),
    staleTime: 60_000,
  })
  const kyaariQuery = useQuery({
    queryKey: ['farm-kyaaris', card.farmId],
    queryFn: () => fetchKyaarisForFarm(card.farmId),
    staleTime: 60_000,
  })

  // Both chips only render a concrete status once their backing queries
  // resolve. We deliberately do NOT seed from the row-level
  // `verification_status` (`card.farmEligibilityStatus` /
  // `card.craConsentStatus`) — that field is the farm's general status
  // and would create a brief inconsistency with the per-document /
  // per-kyaari values shown on the Farm Detail screen. Showing a neutral
  // "—" for a beat is the honest answer.
  const eligibilityReady = !!docsQuery.data && !!kyaariQuery.data
  const eligibility = useMemo<CardStatus | null>(() => {
    if (!eligibilityReady) return null
    return computeFarmEligibility(docsQuery.data!, idStatus, kyaariQuery.data!)
  }, [eligibilityReady, docsQuery.data, kyaariQuery.data, idStatus])

  const consentReady = !!docsQuery.data
  const consent = useMemo<CardStatus | null>(() => {
    if (!consentReady) return null
    return computeCraConsentStatus(docsQuery.data!)
  }, [consentReady, docsQuery.data])

  // Plot count comes from the kyari/all API (same source as farm detail).
  // The farm-list row rarely ships kyaari_count, so card.kyaariCount is only
  // a fallback while the query is in flight or after a hard error.
  const plantationPlotCount =
    kyaariQuery.data != null ? kyaariQuery.data.length : card.kyaariCount

  const onNavigate = () => {
    if (row) {
      persistFarmDetailNav({ row, projectType: card.projectTypeRaw })
    }
  }

  return (
    <Link href={href} className="fp-farm-card" onClick={onNavigate}>
      <div className="fp-farm-card__head">
        <span className="fp-tile-icon fp-tile-icon--sage" aria-hidden>
          <Trees size={20} />
        </span>
        <div className="fp-farm-card__body">
          <h3 className="fp-farm-card__name">{farmName}</h3>
          <p className="fp-farm-card__meta">
            {t('plantation_plots', { count: plantationPlotCount })} · {card.projectType}
          </p>
        </div>
        <ChevronRight size={20} className="fp-farm-card__chev" aria-hidden />
      </div>
      <div className="fp-farm-card__chips">
        <span
          className={`fp-status-block fp-status-block--${
            eligibility ? ELIGIBILITY_TONE[eligibility] : 'default'
          }`}
        >
          <span className="fp-status-block__label">{t('eligibility_status')}</span>
          <span className="fp-status-block__value">
            {eligibility ? t(ELIGIBILITY_LABEL[eligibility]) : '—'}
          </span>
        </span>
        <span
          className={`fp-status-block fp-status-block--${
            consent ? consentTone(consent) : 'default'
          }`}
        >
          <span className="fp-status-block__label">{t('consent_status')}</span>
          <span className="fp-status-block__value">
            {consent ? t(consentLabelKey(consent)) : '—'}
          </span>
        </span>
      </div>
    </Link>
  )
}
