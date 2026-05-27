'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Home, LifeBuoy, UserCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import '../../styles/components/shell/BottomNav.css'

const NAV_ITEMS = [
  { href: '/', icon: Home, labelKey: 'home' },
  { href: '/notifications/', icon: Bell, labelKey: 'alerts' },
  { href: '/support/', icon: LifeBuoy, labelKey: 'support' },
  { href: '/profile/', icon: UserCircle2, labelKey: 'profile' },
] as const

export function BottomNav() {
  const pathname = usePathname() ?? ''
  const { t } = useTranslation()

  return (
    <nav className="fp-bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
        const active =
          href === '/'
            ? pathname === '/' || pathname === ''
            : pathname.startsWith(href.replace(/\/$/, ''))
        return (
          <Link
            key={href}
            href={href}
            className={`fp-bottom-nav__item${active ? ' fp-bottom-nav__item--active' : ''}`}
          >
            <Icon size={20} strokeWidth={2.2} aria-hidden />
            <span>{t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
