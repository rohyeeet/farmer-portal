import type { FarmDocumentBucket } from '../types/farmDocuments.api'
import type { KyaariModule } from '../types/kyaari.api'
import type { VerificationStatus } from '../types/verification.types'

/* =========================================================================
 *  Farm-card status calculation
 * -------------------------------------------------------------------------
 *  Eligibility = land-document status + ID (eKYC) status + kyaari status,
 *  where the kyaari aggregate is "any one accepted ⇒ ACCEPTED".
 *  `idStatus` is the farmer-level eKYC flag from bootstrap — the ID Card
 *  is a farmer artefact, not a per-farm artefact, so we don't fetch it
 *  per farm.
 *
 *  Cascade rule (matches the product spec, in PRIORITY order):
 *     1. All three ACCEPTED          → ACCEPTED
 *     2. Any REJECTED                → REJECTED
 *     3. Any PENDING (or IN_PROGRESS)→ PENDING
 *     4. Any MISSING                 → MISSING
 *
 *  Consent = the CRA document's status (binary on the listing: a CRA doc
 *  with a non-empty media URL counts as ACCEPTED / "Generated"; everything
 *  else is MISSING / "Yet to generate").
 * ========================================================================= */

export type CardStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'MISSING'

const LAND_DOC_SUB_TYPE = 'AgroFarmLandRecord'
const CRA_DOC_SUB_TYPE = 'AgroFarmDigitalCRA'

/** Treat IN_PROGRESS as PENDING; everything else passes through. */
export function normalizeCardStatus(s: VerificationStatus): CardStatus {
  if (s === 'IN_PROGRESS') return 'PENDING'
  return s
}

/**
 * Single source of truth for normalising the raw `verification_status`
 * string that comes off any media row. Used by both:
 *   - the calculated eligibility chip on Home FarmCard
 *   - the per-row "Pending / Accepted / Rejected / Missing" pill on the
 *     Farm Detail documentation list
 * so the two surfaces can never disagree.
 */
export function normalizeVerificationStatus(
  raw: string | null | undefined,
): CardStatus {
  if (!raw) return 'MISSING'
  const u = raw.trim().toUpperCase()
  if (u === 'ACCEPTED' || u === 'APPROVED') return 'ACCEPTED'
  if (u === 'REJECTED' || u === 'DECLINED') return 'REJECTED'
  if (u === 'PENDING' || u === 'IN_PROGRESS' || u === 'IN-PROGRESS') {
    return 'PENDING'
  }
  if (u === 'MISSING') return 'MISSING'
  // Unknown values are treated as PENDING — never silently labelled
  // "Accepted" or "Missing".
  return 'PENDING'
}

/**
 * Combines a set of statuses using the eligibility cascade.
 * Priority order: all ACCEPTED → REJECTED → PENDING → MISSING.
 */
export function combineStatuses(statuses: CardStatus[]): CardStatus {
  if (statuses.length === 0) return 'MISSING'
  if (statuses.every((s) => s === 'ACCEPTED')) return 'ACCEPTED'
  if (statuses.some((s) => s === 'REJECTED')) return 'REJECTED'
  if (statuses.some((s) => s === 'PENDING')) return 'PENDING'
  return 'MISSING'
}

/**
 * Aggregates kyaari statuses for the farm. The spec ("any one kyaari has
 * to be accepted under that farm") means: a single ACCEPTED kyaari is
 * enough to call the kyaari leg ACCEPTED. Otherwise the same cascade is
 * applied to the remaining kyaari statuses.
 */
export function aggregateKyaariStatuses(kyaaris: KyaariModule[]): CardStatus {
  if (kyaaris.length === 0) return 'MISSING'
  const statuses = kyaaris.map((k) => normalizeCardStatus(k.verificationStatus))
  if (statuses.some((s) => s === 'ACCEPTED')) return 'ACCEPTED'
  if (statuses.some((s) => s === 'REJECTED')) return 'REJECTED'
  if (statuses.some((s) => s === 'PENDING')) return 'PENDING'
  return 'MISSING'
}

/** Latest verification status for a given doc bucket, or MISSING. */
function latestDocStatus(
  buckets: FarmDocumentBucket[],
  refSubType: string,
): CardStatus {
  const bucket = buckets.find((b) => b.refSubType === refSubType)
  const latest = bucket?.docs[0]
  if (!latest) return 'MISSING'
  return normalizeVerificationStatus(latest.verificationStatus)
}

export function computeLandDocStatus(buckets: FarmDocumentBucket[]): CardStatus {
  return latestDocStatus(buckets, LAND_DOC_SUB_TYPE)
}

/**
 * Consent = CRA. A CRA artefact only exists once it's generated; backend
 * may return PENDING/IN_PROGRESS while generation is in flight. The card
 * surfaces the status as-is so the chip can flip from "Yet to generate"
 * to "Generated" the moment the artefact lands.
 */
export function computeCraConsentStatus(buckets: FarmDocumentBucket[]): CardStatus {
  const bucket = buckets.find((b) => b.refSubType === CRA_DOC_SUB_TYPE)
  const latest = bucket?.docs[0]
  if (!latest || !latest.id || !latest.mediaUrl) return 'MISSING'
  return latestDocStatus(buckets, CRA_DOC_SUB_TYPE)
}

/**
 * Eligibility = combine(landDoc, idStatus (eKYC), kyaariAggregate).
 *
 * `idStatus` is the farmer-level eKYC status read from bootstrap. The
 * land doc and kyaari aggregate are per-farm.
 */
export function computeFarmEligibility(
  buckets: FarmDocumentBucket[],
  idStatus: VerificationStatus,
  kyaaris: KyaariModule[],
): CardStatus {
  return combineStatuses([
    computeLandDocStatus(buckets),
    normalizeCardStatus(idStatus),
    aggregateKyaariStatuses(kyaaris),
  ])
}
