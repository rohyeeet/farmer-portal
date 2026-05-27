'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MobileShell } from './MobileShell'

export function PortalShellWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const isOnboarding = pathname.startsWith('/onboarding')
  const isDocument = pathname.startsWith('/document/')

  // Onboarding renders its own full-viewport layout (with brand footer);
  // we keep MobileShell purely to hide the bottom nav, but switch to a
  // flush variant that drops max-width and side padding so the card can
  // breathe.
  if (isOnboarding) {
    return (
      <MobileShell hideNav variant="flush">
        {children}
      </MobileShell>
    )
  }

  return <MobileShell hideNav={isDocument}>{children}</MobileShell>
}
