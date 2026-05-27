'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageDropdown } from '../ui/LanguageDropdown'
import { BrandMark } from '../brand/BrandMark'
import '../../styles/components/shell/PageHeader.css'

type PageHeaderProps = {
  variant?: 'home' | 'sub'
  title?: string
  subtitle?: string
  backHref?: string
  /** Show the brand chip in the trailing slot (default on sub pages) */
  brandChip?: boolean
  /** Show the language dropdown in the trailing slot (overrides brand chip) */
  showLanguage?: boolean
  /** Custom right-slot replacing both brand chip + language dropdown */
  rightSlot?: ReactNode
  /** When variant="home", small label above the welcome */
  eyebrow?: string
  /** When variant="sub", render custom node as the title (e.g. brand lockup) */
  titleNode?: ReactNode
}

export function PageHeader({
  variant = 'sub',
  title,
  subtitle,
  backHref,
  brandChip = true,
  showLanguage = false,
  rightSlot,
  eyebrow,
  titleNode,
}: PageHeaderProps) {
  const { t } = useTranslation()

  if (variant === 'home') {
    return (
      <header className="fp-page-header fp-page-header--home">
        <div className="fp-page-header__home-body">
          <p className="fp-page-header__eyebrow">{eyebrow ?? 'Varaha Portal'}</p>
          {subtitle ? <h1 className="fp-page-header__welcome">{subtitle}</h1> : null}
        </div>
        <LanguageDropdown />
      </header>
    )
  }

  const right =
    rightSlot ??
    (showLanguage ? (
      <LanguageDropdown />
    ) : brandChip ? (
      <span className="fp-page-header__brand-chip" aria-hidden>
        <BrandMark size={18} />
      </span>
    ) : (
      <span className="fp-page-header__back-spacer" />
    ))

  return (
    <header className="fp-page-header">
      <div className="fp-page-header__row">
        {backHref ? (
          <Link href={backHref} className="fp-page-header__back" aria-label={t('back')}>
            <ChevronLeft size={22} aria-hidden />
          </Link>
        ) : (
          <span className="fp-page-header__back-spacer" />
        )}
        <div className="fp-page-header__title-stack">
          {titleNode ?? <h1 className="fp-page-header__title">{title}</h1>}
          {subtitle ? <p className="fp-page-header__sub">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </header>
  )
}
