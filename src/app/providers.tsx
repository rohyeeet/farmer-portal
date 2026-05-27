'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider'
import { BootstrapProvider } from '../bootstrap/BootstrapProvider'
import { I18nProvider } from './I18nProvider'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <I18nProvider>
        <AuthProvider>
          <BootstrapProvider>{children}</BootstrapProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  )
}
