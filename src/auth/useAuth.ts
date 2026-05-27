import { useContext } from 'react'
import { AuthStateContext } from './authContext'
import type { AuthContextValue } from './authTypes'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthStateContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
