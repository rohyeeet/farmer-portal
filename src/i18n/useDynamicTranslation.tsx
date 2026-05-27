'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PortalLanguage } from '../types/verification.types'
import {
  getCachedTranslation,
  isTranslatable,
  translateText,
} from '../services/translateService'

const SOURCE_LANG: PortalLanguage = 'en'

function asPortalLang(raw: string | undefined): PortalLanguage {
  if (raw === 'hi' || raw === 'kn' || raw === 'ta' || raw === 'en') return raw
  return 'en'
}

/**
 * Resolve a backend-derived string into the active UI language.
 *
 * - Returns the original text synchronously (or the cached translation if
 *   we already have it) — UI never flashes a placeholder.
 * - Re-runs when the i18n language changes, with results merged into a
 *   keyed translation map so we never call `setState` synchronously inside
 *   an effect (avoids cascading renders).
 * - Honours `isTranslatable` so masked numbers, IDs, etc. pass through.
 *
 * Pass `skip` to opt out (e.g. for proper nouns / farmer names).
 */
export function useDynamicTranslation(
  text: string | null | undefined,
  options: { skip?: boolean } = {},
): string {
  const { i18n } = useTranslation()
  const target = asPortalLang(i18n.language)
  const skip = options.skip === true
  const original = (text ?? '').trim()
  const mapKey = `${target}|${original}`

  const synchronous = useMemo(() => {
    if (skip || !isTranslatable(original)) return original
    return getCachedTranslation(original, SOURCE_LANG, target) ?? original
  }, [original, target, skip])

  const [asyncResults, setAsyncResults] = useState<Record<string, string>>({})

  useEffect(() => {
    if (skip || !isTranslatable(original) || target === SOURCE_LANG) return
    let cancelled = false
    void translateText(original, SOURCE_LANG, target).then((value) => {
      if (cancelled) return
      setAsyncResults((prev) => (prev[mapKey] === value ? prev : { ...prev, [mapKey]: value }))
    })
    return () => {
      cancelled = true
    }
  }, [original, target, skip, mapKey])

  return asyncResults[mapKey] ?? synchronous
}

/**
 * Inline equivalent of `useDynamicTranslation` for use directly in JSX.
 *
 *   <T>{row.state}</T>
 *   <T skip>{farmer.name}</T>   // explicit proper-noun bypass
 */
export function T({
  children,
  skip,
}: {
  children: ReactNode
  skip?: boolean
}): ReactNode {
  const text = typeof children === 'string' ? children : ''
  const translated = useDynamicTranslation(text, { skip })
  if (typeof children !== 'string') return children
  return translated
}
