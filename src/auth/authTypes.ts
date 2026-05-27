import type { ValidateOtpResponseBody } from '../types/auth.api'
import type { PersistedAuthSessionV1 } from './authSession.types'

export type AuthContextValue = {
  session: PersistedAuthSessionV1 | null
  isAuthenticated: boolean
  /** True after client has read `sessionStorage` once — avoids redirect races before hydration. */
  authHydrated: boolean
  completeLogin: (body: ValidateOtpResponseBody) => void
  logout: () => void
}
