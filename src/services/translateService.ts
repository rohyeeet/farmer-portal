/**
 * Backend-derived string translator.
 *
 * Goals
 * - Translate user-facing strings that come from the backend (region names,
 *   verification remarks, server-sent banner copy, etc.) into the active UI
 *   language on the fly.
 * - Do this without an API key or backend proxy — uses the public, free
 *   MyMemory Translation API (no-auth, ~5000 words/day per IP). If MyMemory is
 *   unreachable we degrade silently to the original text.
 * - Cache aggressively: an in-memory map plus sessionStorage so a single
 *   language switch only does network work once per (source → target → text)
 *   triplet.
 * - Skip translation for strings that aren't natural language: codes, masked
 *   numbers, dashes, numeric values, masked Aadhaar/account strings, etc.
 *
 * Pure, side-effect-free utilities. UI binding lives in
 * `src/i18n/useDynamicTranslation.ts`.
 */

import type { PortalLanguage } from '../types/verification.types'

const CACHE_STORAGE_KEY = 'fp_translation_cache_v1'
const MAX_PER_REQUEST = 480 // MyMemory hard caps at 500 chars per `q=`

type CacheMap = Record<string, string>

let memoryCache: CacheMap | null = null

function loadCache(): CacheMap {
  if (memoryCache) return memoryCache
  if (typeof window === 'undefined') {
    memoryCache = {}
    return memoryCache
  }
  try {
    const raw = window.sessionStorage.getItem(CACHE_STORAGE_KEY)
    memoryCache = raw ? (JSON.parse(raw) as CacheMap) : {}
  } catch {
    memoryCache = {}
  }
  return memoryCache
}

function persistCache(): void {
  if (typeof window === 'undefined' || !memoryCache) return
  try {
    window.sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(memoryCache))
  } catch {
    /* quota — silent */
  }
}

function cacheKey(source: PortalLanguage, target: PortalLanguage, text: string): string {
  return `${source}>${target}:${text}`
}

/**
 * Should we even attempt to translate this string?
 *
 * Returns false for masked numbers, ID-like strings, pure digits, and very
 * short tokens — i.e. things that don't carry meaning and shouldn't burn
 * MyMemory quota.
 */
export function isTranslatable(text: string | null | undefined): text is string {
  if (!text) return false
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed === '—' || trimmed === '-' || trimmed === '·') return false
  if (/^[\d\s+()-]+$/.test(trimmed)) return false // phone, account, OTP
  if (/^[A-Z]{2,}-\d/.test(trimmed)) return false // VARH-123, FARM-7
  if (/X{3,}/.test(trimmed)) return false // masked Aadhaar/account
  if (/^•+/.test(trimmed)) return false // masked bullets
  return trimmed.length >= 2
}

type MyMemoryResponse = {
  responseStatus?: number
  responseData?: { translatedText?: string }
  responseDetails?: string
}

async function callMyMemory(
  text: string,
  source: PortalLanguage,
  target: PortalLanguage,
): Promise<string | null> {
  const params = new URLSearchParams({
    q: text.slice(0, MAX_PER_REQUEST),
    langpair: `${source}|${target}`,
  })
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`
  try {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as MyMemoryResponse
    const out = data.responseData?.translatedText?.trim()
    if (!out) return null
    if (data.responseStatus && data.responseStatus !== 200) return null
    if (out.toUpperCase().startsWith('MYMEMORY WARNING')) return null
    return out
  } catch {
    return null
  }
}

/**
 * Translate `text` from `source` to `target` language.
 *
 * - Returns the original text when translation isn't needed (same language,
 *   non-translatable, or MyMemory unreachable).
 * - Idempotent and cached.
 */
export async function translateText(
  text: string,
  source: PortalLanguage,
  target: PortalLanguage,
): Promise<string> {
  if (!isTranslatable(text)) return text
  if (source === target) return text

  const cache = loadCache()
  const key = cacheKey(source, target, text)
  const hit = cache[key]
  if (hit) return hit

  const translated = await callMyMemory(text, source, target)
  const final = translated ?? text
  cache[key] = final
  persistCache()
  return final
}

/** Synchronous cache lookup — used to render instantly if we already know it. */
export function getCachedTranslation(
  text: string,
  source: PortalLanguage,
  target: PortalLanguage,
): string | null {
  if (!isTranslatable(text)) return text
  if (source === target) return text
  const cache = loadCache()
  return cache[cacheKey(source, target, text)] ?? null
}

/**
 * Bulk translate. Resolves in parallel and is cached per-item.
 * Use this to pre-warm region/document labels after a language switch.
 */
export function translateBatch(
  texts: ReadonlyArray<string>,
  source: PortalLanguage,
  target: PortalLanguage,
): Promise<string[]> {
  return Promise.all(texts.map((t) => translateText(t, source, target)))
}
