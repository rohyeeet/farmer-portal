import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ValidateOtpResponseBody } from '../types/auth.api'
import type { PersistedAuthSessionV1 } from './authSession.types'
import { AuthStateContext } from './authContext'
import type { AuthContextValue } from './authTypes'
import {
  clearAuthSession,
  getAuthHeaderRecord,
  readAuthSession,
  writeAuthSessionFromValidateResponse,
} from './authSessionStorage'
import { getApiUrl } from '../config/apiRegistry'

async function fireAndForgetLogout(): Promise<void> {
  try {
    if (!readAuthSession()) return
    const headers = getAuthHeaderRecord()
    await fetch(getApiUrl('logout'), {
      method: 'POST',
      headers,
      credentials: 'omit',
      keepalive: true,
    })
  } catch {
    /* Server may not implement logout; client-side clear still happens. */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PersistedAuthSessionV1 | null>(null)
  const [authHydrated, setAuthHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(readAuthSession())
    setAuthHydrated(true)
  }, [])

  const completeLogin = useCallback((body: ValidateOtpResponseBody) => {
    writeAuthSessionFromValidateResponse(body)
    setSession(readAuthSession())
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      void fireAndForgetLogout()
    }
    clearAuthSession()
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      authHydrated,
      completeLogin,
      logout,
    }),
    [session, authHydrated, completeLogin, logout],
  )

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>
}
