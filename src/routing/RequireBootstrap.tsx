'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useBootstrap } from '../bootstrap/BootstrapProvider'
import { PageError } from '../components/ui/PageError'
import { PageLoading } from '../components/ui/PageLoading'
import { useAuth } from '../auth/useAuth'
import { isFullyVerified } from '../types/verification.types'

const ONBOARDING_PREFIX = '/onboarding'

type Gate =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'redirect'; path: string }
  | { kind: 'ready' }

/**
 * After login the user always lands on `/` and is free to browse. eKYC / BAV
 * remediation surfaces through the verification banner and explicit profile
 * affordances — never as a route hijack. The only redirect we still perform
 * is to push a *fully verified* user away from `/onboarding/*` (except the
 * success page) back home.
 */
export default function RequireBootstrap({ children }: { children: ReactNode }) {
  const { bootstrap, status, error, refresh } = useBootstrap()
  const { logout } = useAuth()
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const onOnboarding = pathname.startsWith(ONBOARDING_PREFIX)
  const onSuccess = pathname.includes('/success')

  const gate: Gate = useMemo(() => {
    if (status === 'loading' || status === 'idle') return { kind: 'loading' }
    if (status === 'error') return { kind: 'error' }
    if (!bootstrap) return { kind: 'loading' }

    const verified = isFullyVerified(
      bootstrap.identityConfirmed,
      bootstrap.ekycStatus,
      bootstrap.bavStatus,
    )

    if (verified && onOnboarding && !onSuccess) {
      return { kind: 'redirect', path: '/' }
    }

    return { kind: 'ready' }
  }, [bootstrap, status, onOnboarding, onSuccess])

  useEffect(() => {
    if (gate.kind === 'redirect') {
      router.replace(gate.path)
    }
  }, [gate, router])

  if (gate.kind === 'loading' || gate.kind === 'redirect') {
    return <PageLoading />
  }

  if (gate.kind === 'error') {
    return (
      <PageError
        message={error ?? 'Could not load your profile.'}
        onRetry={() => void refresh()}
        onLogout={() => {
          logout()
          router.replace('/login/')
        }}
      />
    )
  }

  return <>{children}</>
}
