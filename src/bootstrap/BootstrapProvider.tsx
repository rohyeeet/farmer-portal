'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FarmerBootstrap } from '../types/bootstrap.api'
import { composeBootstrap } from '../services/bootstrapService'
import { ApiError } from '../services/http/ApiError'
import { useAuth } from '../auth/useAuth'

const BOOTSTRAP_QUERY_KEY = ['farmer', 'bootstrap'] as const

export type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error'

type BootstrapContextValue = {
  bootstrap: FarmerBootstrap | null
  status: BootstrapStatus
  error: string | null
  refresh: () => Promise<void>
  /** Optimistically patch fields in the bootstrap cache without a refetch. */
  patchBootstrap: (patch: Partial<FarmerBootstrap>) => void
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null)

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Could not load your profile. Please try again.'
}

export function BootstrapProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: BOOTSTRAP_QUERY_KEY,
    queryFn: () => composeBootstrap(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: BOOTSTRAP_QUERY_KEY })
    await refetch()
  }, [queryClient, refetch])

  const patchBootstrap = useCallback((patch: Partial<FarmerBootstrap>) => {
    queryClient.setQueryData<FarmerBootstrap>(BOOTSTRAP_QUERY_KEY, (old) =>
      old ? { ...old, ...patch } : old,
    )
  }, [queryClient])

  const status: BootstrapStatus = useMemo(() => {
    if (!isAuthenticated) return 'idle'
    if (isPending || (isFetching && !data)) return 'loading'
    if (isError) return 'error'
    if (data) return 'ready'
    return 'loading'
  }, [isAuthenticated, isPending, isFetching, isError, data])

  const value = useMemo<BootstrapContextValue>(
    () => ({
      bootstrap: data ?? null,
      status,
      error: isError ? errorMessage(error) : null,
      refresh,
      patchBootstrap,
    }),
    [data, status, isError, error, refresh, patchBootstrap],
  )

  return (
    <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>
  )
}

export function useBootstrap(): BootstrapContextValue {
  const ctx = useContext(BootstrapContext)
  if (!ctx) throw new Error('useBootstrap must be used within BootstrapProvider')
  return ctx
}

export function useBootstrapQueryKey() {
  return BOOTSTRAP_QUERY_KEY
}
