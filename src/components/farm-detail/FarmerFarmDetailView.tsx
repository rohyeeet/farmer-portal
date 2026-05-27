'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  FileSignature,
  FileText,
  HelpCircle,
  Languages,
  Map as MapIcon,
  Minus,
  ScrollText,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { FarmProjectType, FarmTableRow } from '../../types/farm.api'
import type { FarmDocumentBucket } from '../../types/farmDocuments.api'
import { PageHeader } from '../shell/PageHeader'
import { FarmBoundaryGoogleMap } from './FarmBoundaryGoogleMap'
import {
  fetchFarmDocumentsByProject,
  getDocBucketCategory,
} from '../../services/farmDocumentsApi'
import { fetchKyaarisForFarm } from '../../services/kyaariApi'
import type { KyaariModule } from '../../types/kyaari.api'
import { buildDocumentRoute } from '../../utils/documentGating'
import { normalizeVerificationStatus } from '../../utils/farmCardStatusCompute'
import { persistFarmDetailNav } from '../../types/farmDetailNav'
import { useDynamicTranslation } from '../../i18n/useDynamicTranslation'

export function FarmerFarmDetailView({
  row,
  projectType,
}: {
  row: FarmTableRow
  projectType: FarmProjectType
}) {
  const { t } = useTranslation()
  const [docBuckets, setDocBuckets] = useState<FarmDocumentBucket[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [kyaaris, setKyaaris] = useState<KyaariModule[]>([])
  const [kyaarisLoading, setKyaarisLoading] = useState(true)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    persistFarmDetailNav({ row, projectType })
  }, [row, projectType])

  useEffect(() => {
    let cancelled = false
    fetchFarmDocumentsByProject(projectType, row.id)
      .then((buckets) => {
        if (!cancelled) setDocBuckets(buckets)
      })
      .catch(() => {
        if (!cancelled) setDocBuckets([])
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectType, row.id])

  useEffect(() => {
    let cancelled = false
    fetchKyaarisForFarm(row.id)
      .then((list) => {
        if (!cancelled) setKyaaris(list)
      })
      .catch(() => {
        if (!cancelled) setKyaaris([])
      })
      .finally(() => {
        if (!cancelled) setKyaarisLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [row.id])

  const farmImages =
    docBuckets.find((b) => b.refSubType === 'AgroFarmImage')?.docs ?? []
  const docsOnly = docBuckets.filter((b) => b.refSubType !== 'AgroFarmImage')
  const digitalConsents = docsOnly.filter(
    (b) => getDocBucketCategory(b.refSubType) === 'digital_consent',
  )
  const documentation = docsOnly.filter(
    (b) => getDocBucketCategory(b.refSubType) === 'documentation',
  )

  const createdLabel = row.createdDateUnix
    ? new Date(row.createdDateUnix * 1000).toLocaleDateString(undefined, {
        dateStyle: 'long',
      })
    : '—'

  const slides: ('map' | 'photo')[] = []
  if (row.boundary) slides.push('map')
  if (farmImages[0]?.mediaUrl) slides.push('photo')
  if (slides.length === 0) slides.push('map')

  const farmIdLabel = `FARM-${row.id}`
  const translatedSurveyor = useDynamicTranslation(row.surveyorName, { skip: true })
  const translatedOrganization = useDynamicTranslation(row.organization)
  const translatedFarmName = useDynamicTranslation(row.farmName, { skip: true })

  return (
    <div className="fp-screen">
      <PageHeader
        title={translatedFarmName.toUpperCase()}
        subtitle={farmIdLabel}
        backHref="/"
        brandChip
      />

      <section className="fp-carousel" aria-label={translatedFarmName}>
        <div className="fp-farm-hero">
          {slides[slide] === 'map' ? (
            row.boundary ? (
              <FarmBoundaryGoogleMap boundary={row.boundary} />
            ) : (
              <span
                className="fp-farm-hero__svg"
                aria-hidden
                style={{
                  color: '#fff',
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {t('enlarge_map')}
              </span>
            )
          ) : farmImages[0]?.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={farmImages[0].mediaUrl}
              alt={translatedFarmName}
              className="fp-farm-hero__img"
              loading="lazy"
            />
          ) : null}
          {slides[slide] === 'map' ? (
            <span className="fp-farm-hero__overlay-bl">
              <span className="fp-farm-hero__mode-pill">{t('mapping_mode')}</span>
            </span>
          ) : null}
          <span className="fp-farm-hero__overlay-br">
            <span className="fp-farm-hero__boundary-pill">
              {t('boundary')}
              <strong>
                {row.areaAcres.toFixed(1)} {t('acres')}
              </strong>
            </span>
          </span>
        </div>
        {slides.length > 1 ? (
          <div className="fp-carousel__dots" role="tablist">
            {slides.map((s, i) => (
              <button
                key={s + i}
                type="button"
                role="tab"
                aria-label={`Slide ${i + 1}`}
                aria-selected={slide === i}
                className={`fp-carousel__dot${slide === i ? ' fp-carousel__dot--active' : ''}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="fp-meta-card">
        <div className="fp-meta-card__cell">
          <p className="fp-meta-card__label">{t('onboarding_date')}</p>
          <p className="fp-meta-card__value">{createdLabel}</p>
        </div>
        <div className="fp-meta-card__cell fp-meta-card__cell--right">
          <p className="fp-meta-card__label">{t('onboarded_by_label')}</p>
          <p className="fp-meta-card__value">{translatedSurveyor || '—'}</p>
          <p className="fp-meta-card__value-sub">{translatedOrganization || ''}</p>
        </div>
      </section>

      <div className="fp-section">
        <h2 className="fp-section__title">{t('kyaari_list')}</h2>
        {!kyaarisLoading ? (
          <span className="fp-section__meta">
            {t('modules_mapped', { count: kyaaris.length })}
          </span>
        ) : null}
      </div>

      {kyaarisLoading ? <p className="fp-muted">{t('loading')}</p> : null}
      {!kyaarisLoading && kyaaris.length === 0 ? (
        <p className="fp-muted">{t('no_kyaaris_yet')}</p>
      ) : null}

      <div className="fp-card-stack">
        {kyaaris.map((k, i) => (
          <article key={k.kyaariId} className="fp-kyaari-row">
            <span className="fp-kyaari-row__num">{i + 1}</span>
            <div className="fp-kyaari-row__body">
              <h3 className="fp-kyaari-row__name">{k.kyaariName}</h3>
              <p className="fp-kyaari-row__meta">
                {k.treeCount} {t('trees')} · {k.areaAcres} {t('acres')}
              </p>
            </div>
            <DocStatusPill status={k.verificationStatus} t={t} />
          </article>
        ))}
      </div>

      <div className="fp-section">
        <h2 className="fp-section__title fp-section__title--icon">
          <span className="fp-brand-mark fp-brand-mark--sm" aria-hidden>
            <ShieldCheck size={14} />
          </span>
          {t('legal_registry')}
        </h2>
      </div>

      <div className="fp-screen-stack--md" style={{ display: 'grid', gap: 'var(--fp-space-3)' }}>
        <h3 className="fp-subsection-title">{t('digital_consents')}</h3>
        {docsLoading ? <p className="fp-muted">{t('loading')}</p> : null}
        {!docsLoading && digitalConsents.length === 0 ? (
          <p className="fp-muted">{t('no_documents_yet')}</p>
        ) : null}
        <div className="fp-card-stack">
          {digitalConsents.map((bucket) => (
            <DigitalConsentRow
              key={bucket.refSubType}
              bucket={bucket}
              farmId={row.id}
              projectType={projectType}
              t={t}
            />
          ))}
        </div>

        <h3 className="fp-subsection-title" style={{ marginTop: 'var(--fp-space-4)' }}>
          {t('documentation')}
        </h3>
        {!docsLoading && documentation.length === 0 ? (
          <p className="fp-muted">{t('no_documents_yet')}</p>
        ) : null}
        <div className="fp-card-stack">
          {documentation.map((bucket) => (
            <DocumentationRow
              key={bucket.refSubType}
              bucket={bucket}
              farmId={row.id}
              projectType={projectType}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Status helpers (kyaari rows + documentation rows share this) ----------
   Both the per-document pill on this screen AND the calculated chip on
   the Home FarmCard funnel through `normalizeVerificationStatus`, so the
   two surfaces are guaranteed to agree on what "ACCEPTED / PENDING /
   REJECTED / MISSING" means for a given backend value. */

type DocStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'MISSING'
type StatusTone = 'accepted' | 'pending' | 'rejected' | 'default'

const STATUS_LABEL: Record<DocStatus, string> = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
  MISSING: 'missing',
}

function normalizeDocStatus(raw: string | null | undefined): DocStatus {
  return normalizeVerificationStatus(raw)
}

function statusToneOf(status: DocStatus): StatusTone {
  if (status === 'ACCEPTED') return 'accepted'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'PENDING') return 'pending'
  return 'default'
}

function StatusIcon({ tone, size = 14 }: { tone: StatusTone; size?: number }) {
  if (tone === 'accepted') return <Check size={size} strokeWidth={3} />
  if (tone === 'rejected') return <X size={size} strokeWidth={3} />
  if (tone === 'pending') return <Clock size={size} strokeWidth={2.4} />
  return <Minus size={size} strokeWidth={2.4} />
}

function DocStatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const s = normalizeDocStatus(status)
  const tone = statusToneOf(s)
  return (
    <span className={`fp-status fp-status--${tone}`}>
      <span className="fp-status__dot" aria-hidden>
        <StatusIcon tone={tone} size={12} />
      </span>
      {t(STATUS_LABEL[s])}
    </span>
  )
}

/* ---------- Per-bucket icon mapping ----------
   Each documentation row gets a glyph that signals its purpose at a glance:
   - Land Document  → map (the plot)
   - Land Declaration → scroll (legal declaration)
   - Farmer Holding Consent → signed file (consent / agreement)
   - FPIC → badge with check (free prior informed consent)
   - FPIC Local → languages (vernacular variant) */
const DOC_BUCKET_ICONS: Record<string, LucideIcon> = {
  AgroFarmLandRecord: MapIcon,
  AgroFarmLandLordDeclaration: ScrollText,
  AgroFarmHoldingConsent: FileSignature,
  AgroFarmFPIC: BadgeCheck,
  AgroFarmFPICLocal: Languages,
}

function DocBucketIcon({ subType, size = 20 }: { subType: string; size?: number }) {
  const Icon = DOC_BUCKET_ICONS[subType] ?? FileText
  return <Icon size={size} aria-hidden strokeWidth={2} />
}

/* ---------- Documentation row ----------
   Backed by a verifiable, farmer-supplied artefact (FPIC, FPIC Local,
   Holding Consent, Land Record, Landlord Declaration). Status is one of
   PENDING / ACCEPTED / REJECTED / MISSING. Clicking opens the PDF viewer
   (no AI summary). MISSING rows are inert. */
function DocumentationRow({
  bucket,
  farmId,
  projectType,
  t,
}: {
  bucket: FarmDocumentBucket
  farmId: number
  projectType: FarmProjectType
  t: (k: string, opts?: Record<string, unknown>) => string
}) {
  const latest = bucket.docs[0]
  const label = t(bucket.label)

  if (!latest || !latest.id) {
    const tone: StatusTone = 'default'
    return (
      <div className="fp-doc-row fp-doc-row--pending" aria-disabled="true">
        <span className="fp-tile-icon fp-tile-icon--sage" aria-hidden>
          <DocBucketIcon subType={bucket.refSubType} />
        </span>
        <div className="fp-doc-row__body">
          <p className="fp-doc-row__title">{label}</p>
          <p className={`fp-doc-row__status fp-doc-row__status--${tone}`}>
            <StatusIcon tone={tone} size={11} /> {t('missing')}
          </p>
        </div>
      </div>
    )
  }

  const status = normalizeDocStatus(latest.verificationStatus)
  const tone = statusToneOf(status)
  const href = buildDocumentRoute(farmId, latest.id, projectType)

  return (
    <Link
      href={href}
      className="fp-doc-row"
      aria-label={`${label} — ${t(STATUS_LABEL[status])}`}
    >
      <span className="fp-tile-icon fp-tile-icon--sage" aria-hidden>
        <DocBucketIcon subType={bucket.refSubType} />
      </span>
      <div className="fp-doc-row__body">
        <p className="fp-doc-row__title">{label}</p>
        <p className={`fp-doc-row__status fp-doc-row__status--${tone}`}>
          <StatusIcon tone={tone} size={11} /> {t(STATUS_LABEL[status])}
        </p>
      </div>
      <ChevronRight size={18} className="fp-doc-row__chev" aria-hidden />
    </Link>
  )
}

/* ---------- Digital consent row ----------
   System-generated artefact (Digital CRA, Digital FPIC). Status lifecycle is
   binary on the listing: "Yet to be generated" or "Generated". Clicking a
   generated row opens the PDF viewer in AI-summary mode. eKYC gating, if any,
   is handled on the detail screen — not in this listing. */
function DigitalConsentRow({
  bucket,
  farmId,
  projectType,
  t,
}: {
  bucket: FarmDocumentBucket
  farmId: number
  projectType: FarmProjectType
  t: (k: string, opts?: Record<string, unknown>) => string
}) {
  const latest = bucket.docs[0]
  const label = t(bucket.label)
  const generated = !!latest && !!latest.id && !!latest.mediaUrl

  if (!generated) {
    return (
      <div className="fp-doc-row fp-doc-row--pending" aria-disabled="true">
        <span className="fp-tile-icon fp-tile-icon--sage" aria-hidden>
          <HelpCircle size={20} />
        </span>
        <div className="fp-doc-row__body">
          <p className="fp-doc-row__title">{label}</p>
          <p className="fp-doc-row__status fp-doc-row__status--default">
            <Clock size={11} strokeWidth={2.4} /> {t('yet_to_be_generated')}
          </p>
        </div>
      </div>
    )
  }

  const href = buildDocumentRoute(farmId, latest!.id, projectType)

  return (
    <Link
      href={href}
      className="fp-doc-row"
      aria-label={`${label} — ${t('generated')}`}
    >
      <span className="fp-tile-icon fp-tile-icon--sage" aria-hidden>
        <Sparkles size={20} />
      </span>
      <div className="fp-doc-row__body">
        <p className="fp-doc-row__title">{label}</p>
        <p className="fp-doc-row__status fp-doc-row__status--accepted">
          <Check size={11} strokeWidth={3} /> {t('generated')}
        </p>
      </div>
      <ChevronRight size={18} className="fp-doc-row__chev" aria-hidden />
    </Link>
  )
}
