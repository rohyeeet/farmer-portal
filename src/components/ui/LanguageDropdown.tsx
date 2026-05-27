'use client'

import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PortalLanguage } from '../../types/verification.types'
import { PORTAL_LANGUAGES } from '../../types/verification.types'
import { writeStoredLanguage } from '../../utils/bootstrapMapping'

const SHORT_CODES: Record<PortalLanguage, string> = {
  en: 'EN',
  hi: 'HI',
  kn: 'KN',
  ta: 'TA',
}

export function LanguageDropdown({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as PortalLanguage
    writeStoredLanguage(lang)
    void i18n.changeLanguage(lang)
  }

  return (
    <label className={`fp-lang-select ${className}`.trim()}>
      {/* No visible label — the globe icon + selected language name carry the
          meaning. The text is kept screen-reader only via .fp-sr-only. */}
      <span className="fp-sr-only">{t('language')}</span>
      <span className="fp-lang-select__field">
        <span className="fp-lang-select__icon" aria-hidden>
          <Globe size={14} strokeWidth={2.2} />
        </span>
        <select
          className="fp-lang-select__control"
          value={i18n.language}
          onChange={onChange}
          aria-label={t('language')}
        >
          {PORTAL_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {SHORT_CODES[code as PortalLanguage] ?? code.toUpperCase()} · {label}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}
