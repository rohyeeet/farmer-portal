'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../auth/useAuth'
import { PageLoading } from '../components/ui/PageLoading'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated) return
    if (!isAuthenticated) {
      router.replace('/login/')
    }
  }, [authHydrated, isAuthenticated, router])

  if (!authHydrated) {
    return <PageLoading />
  }

  if (!isAuthenticated) {
    return <PageLoading />
  }

  return children
}
