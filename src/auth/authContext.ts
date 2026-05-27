import { createContext } from 'react'
import type { AuthContextValue } from './authTypes'

export const AuthStateContext = createContext<AuthContextValue | null>(null)
