import type { FarmProjectType } from '../types/farm.api'
import type { FarmCardModel } from '../types/bootstrap.api'
import { normalizeFarmRow } from '../components/farm-list/farmListNormalize'

function readPlantationPlotCount(o: Record<string, unknown>): number {
  const keys = [
    'kyaari_count',
    'kyari_count',
    'kyaris_count',
    'kyaaris_count',
    'plantation_plot_count',
    'plot_count',
    'total_kyari',
    'total_kyaari',
    'number_of_kyari',
    'number_of_kyaari',
  ]
  for (const key of keys) {
    const v = o[key]
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) return n
    }
  }
  return 0
}

/**
 * Maps a raw farm-list row into the card model.
 *
 * Note: `farmEligibilityStatus` and `craConsentStatus` are NOT derived
 * from this row anymore. The card calculates both live from the
 * documents (`/media/all/`) + eKYC + kyaaris (`/agfarm/{id}/kyaari/all/`)
 * per the rule in `farmCardStatusCompute.ts`. The fields are still
 * present on the model for type compatibility but are unused by the UI.
 */
export function rawFarmToCard(raw: unknown, projectType: FarmProjectType): FarmCardModel | null {
  const row = normalizeFarmRow(raw, projectType)
  if (!row) return null

  const o = raw as Record<string, unknown>
  const kyaariCount = readPlantationPlotCount(o)

  return {
    farmId: row.id,
    farmName: row.farmName === '—' ? `Farm ${row.id}` : row.farmName,
    kyaariCount,
    projectType: projectType === 'ARR' ? 'PLANTATION' : 'RETROSPECTIVE',
    farmEligibilityStatus: 'MISSING',
    craConsentStatus: 'MISSING',
    projectTypeRaw: projectType,
  }
}
