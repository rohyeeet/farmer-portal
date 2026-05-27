import { DEFAULT_FARM_LIST_PROJECT_TYPE } from '../types/farm.api'
import type { FarmerBootstrap } from '../types/bootstrap.api'
import type { PortalLanguage } from '../types/verification.types'
import { mapFarmerToBootstrap, readStoredLanguage } from '../utils/bootstrapMapping'
import { fetchFarmerProfile } from './farmerApi'
import { fetchFarmListPage } from './farmListApi'
import { postFarmerVerificationStatus } from './onboardingApi'
import { resolveFarmerApiId } from '../utils/farmerApiId'

/**
 * Composes the farmer bootstrap snapshot from reused endpoints:
 *   1. Farmer profile (`/api/mobile/v2/farmer/`)
 *   2. Farm list page for the default project
 *   3. Verification status (`/api/mobile/v2/farmer/verification-status/`) when available
 */
export async function composeBootstrap(
  preferredLanguage?: PortalLanguage,
): Promise<FarmerBootstrap> {
  const lang = preferredLanguage ?? readStoredLanguage()

  const [profile, farmPage] = await Promise.all([
    fetchFarmerProfile(),
    fetchFarmListPage(DEFAULT_FARM_LIST_PROJECT_TYPE, {
      page_number: 1,
      page_size: 50,
    }),
  ])

  const ext = profile as Record<string, unknown>
  const farmerApiId = resolveFarmerApiId(ext, profile.id)

  let verification = null
  try {
    verification = await postFarmerVerificationStatus({ farmerApiId })
  } catch {
    /* Profile fields remain the fallback when verification-status is unavailable. */
  }

  return mapFarmerToBootstrap(profile, farmPage.total_count ?? 0, lang, verification)
}

export function getOnboardingEntryPath(bootstrap: FarmerBootstrap): string {
  if (
    bootstrap.identityConfirmed &&
    bootstrap.ekycStatus === 'ACCEPTED' &&
    bootstrap.bavStatus === 'ACCEPTED'
  ) {
    return '/'
  }
  return '/onboarding/claim/'
}

export function onboardingContextFromBootstrap(
  bootstrap: FarmerBootstrap,
): { farmerApiId: string } {
  return { farmerApiId: bootstrap.farmerApiId }
}
