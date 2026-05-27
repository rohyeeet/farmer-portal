'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { VerificationStatusCards } from '../components/home/VerificationStatusCards'
import { FarmCard } from '../components/home/FarmCard'
import { PageError } from '../components/ui/PageError'
import { PageLoading } from '../components/ui/PageLoading'
import { LanguageDropdown } from '../components/ui/LanguageDropdown'
import { fetchFarmListPage } from '../services/farmListApi'
import { DEFAULT_FARM_LIST_PROJECT_TYPE } from '../types/farm.api'
import type { FarmCardModel } from '../types/bootstrap.api'
import { rawFarmToCard } from '../utils/farmCardMapping'
import { ApiError } from '../services/http/ApiError'

export default function HomeScreen() {
  const { t } = useTranslation()
  const { bootstrap } = useBootstrap()

  const {
    data: cards = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['farms', 'home', DEFAULT_FARM_LIST_PROJECT_TYPE],
    queryFn: async () => {
      const page = await fetchFarmListPage(DEFAULT_FARM_LIST_PROJECT_TYPE, {
        page_number: 1,
        page_size: 50,
      })
      return (page.data ?? [])
        .map((raw) => {
          const card = rawFarmToCard(raw, DEFAULT_FARM_LIST_PROJECT_TYPE)
          return card ? { card, raw } : null
        })
        .filter(Boolean) as { card: FarmCardModel; raw: unknown }[]
    },
    enabled: !!bootstrap,
    staleTime: 30_000,
  })

  if (!bootstrap) {
    return <PageLoading />
  }

  const profile = bootstrap.farmerProfile
  const farmError =
    isError && error
      ? error instanceof ApiError
        ? error.message
        : t('error_generic')
      : null

  return (
    <div className="fp-screen">
      <header className="fp-page-header fp-page-header--home">
        <div className="fp-page-header__home-top">
          <p className="fp-page-header__eyebrow">Varaha Portal</p>
          <LanguageDropdown />
        </div>
        <h1 className="fp-page-header__welcome">
          {t('home_welcome')} {profile.name}
        </h1>
      </header>

      <VerificationStatusCards bootstrap={bootstrap} />

      <div className="fp-section" id="my-registry">
        <h2 className="fp-section__title">{t('my_registry')}</h2>
        {cards.length > 0 ? (
          <span className="fp-section__meta">
            {t('registry_farms', { count: cards.length })}
          </span>
        ) : null}
      </div>

      {isPending ? <PageLoading inline /> : null}
      {farmError ? <PageError message={farmError} onRetry={() => void refetch()} /> : null}

      {!isPending && !farmError ? (
        cards.length > 0 ? (
          <div className="fp-card-stack">
            {cards.map(({ card, raw }) => (
              <FarmCard
                key={card.farmId}
                card={card}
                raw={raw}
                idStatus={bootstrap.ekycStatus}
              />
            ))}
          </div>
        ) : (
          <div className="fp-card fp-empty-state">
            <p className="fp-empty-state__title">{t('no_farms_yet')}</p>
            <p className="fp-empty-state__text">{t('no_farms_help')}</p>
          </div>
        )
      ) : null}
    </div>
  )
}
