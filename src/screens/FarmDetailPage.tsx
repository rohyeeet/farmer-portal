'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { FarmerFarmDetailView } from '../components/farm-detail/FarmerFarmDetailView'
import {
  DEFAULT_FARM_LIST_PROJECT_TYPE,
  type FarmProjectType,
} from '../types/farm.api'
import {
  readFarmDetailNavFromCache,
  type FarmDetailLocationState,
} from '../types/farmDetailNav'
import { fetchFarmRowById } from '../services/farmDetailService'
import { PageHeader } from '../components/shell/PageHeader'
import { PageLoading } from '../components/ui/PageLoading'

function parseProjectType(raw: string | null): FarmProjectType {
  if (raw === 'REGEN' || raw === 'ARR') return raw
  return DEFAULT_FARM_LIST_PROJECT_TYPE
}

function parseFarmIdFromPathname(pathname: string): string | undefined {
  const m = pathname.match(/^\/farm\/([^/]+)\/?$/)
  const id = m?.[1]
  if (!id || id === '__build_placeholder__') return undefined
  return id
}

export default function FarmDetailPage() {
  const { t } = useTranslation()
  const params = useParams() ?? {}
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const searchParams = useSearchParams()

  const farmIdRaw = params.farmId
  const farmIdFromParams =
    typeof farmIdRaw === 'string' ? farmIdRaw : Array.isArray(farmIdRaw) ? farmIdRaw[0] : undefined
  const farmId = farmIdFromParams ?? parseFarmIdFromPathname(pathname)
  const idNum = farmId ? Number(farmId) : NaN
  const queryPt = parseProjectType(searchParams?.get('projectType') ?? null)
  const [resolved, setResolved] = useState<FarmDetailLocationState | null | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!farmId || !Number.isFinite(idNum)) {
      router.replace('/')
    }
  }, [farmId, idNum, router])

  useEffect(() => {
    if (!Number.isFinite(idNum)) return
    let cancelled = false

    async function load() {
      const cached = readFarmDetailNavFromCache(idNum, queryPt)
      if (cached?.row?.id === idNum) {
        if (!cancelled) setResolved(cached)
        return
      }
      const cachedAlt = readFarmDetailNavFromCache(
        idNum,
        queryPt === 'ARR' ? 'REGEN' : 'ARR',
      )
      if (cachedAlt?.row?.id === idNum) {
        if (!cancelled) setResolved(cachedAlt)
        return
      }
      const fetched = await fetchFarmRowById(idNum, queryPt)
      if (!cancelled) {
        setResolved(fetched ? { row: fetched.row, projectType: fetched.projectType } : null)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [idNum, queryPt])

  if (!farmId || !Number.isFinite(idNum)) {
    return <PageLoading />
  }
  if (resolved === undefined) {
    return <PageLoading />
  }

  if (!resolved) {
    return (
      <div className="fp-screen">
        <PageHeader title={t('my_farms')} backHref="/" />
        <div className="fp-card fp-empty-state">
          <p>{t('farm_load_error')}</p>
          <Link href="/" className="fp-btn fp-btn--primary">
            {t('home')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <FarmerFarmDetailView
      row={resolved.row}
      projectType={resolved.projectType}
    />
  )
}
