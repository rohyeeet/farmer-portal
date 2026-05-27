'use client'

import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import '../../styles/components/shell/MobileShell.css'

export type MobileShellVariant = 'default' | 'flush'

export function MobileShell({
  children,
  hideNav = false,
  variant = 'default',
}: {
  children: ReactNode
  hideNav?: boolean
  variant?: MobileShellVariant
}) {
  const classes = [
    'fp-mobile-shell',
    hideNav ? 'fp-mobile-shell--no-nav' : '',
    variant === 'flush' ? 'fp-mobile-shell--flush' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <main className="fp-mobile-shell__main">{children}</main>
      {!hideNav ? <BottomNav /> : null}
    </div>
  )
}
