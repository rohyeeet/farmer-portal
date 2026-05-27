'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, HelpCircle, MessageCircle, Phone } from 'lucide-react'
import { PageHeader } from '../components/shell/PageHeader'

const SUPPORT_PHONE = '+911800000000'
const SUPPORT_WHATSAPP = '+919900000000'

const FAQS = ['faq_1', 'faq_2', 'faq_3', 'faq_4'] as const

export default function SupportScreen() {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="fp-screen">
      <PageHeader title={t('support')} backHref="/" brandChip />

      <section className="fp-support-hero" aria-label={t('need_help')}>
        <span className="fp-support-hero__icon" aria-hidden>
          <Phone size={24} strokeWidth={2.2} />
        </span>
        <h2 className="fp-support-hero__title">{t('need_help')}</h2>
        <p className="fp-support-hero__sub">{t('support_active')}</p>

        <div className="fp-support-hero__cta-stack">
          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="fp-btn fp-btn--primary fp-btn--lg"
          >
            <Phone size={16} aria-hidden /> {t('call_support')}
          </a>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="fp-btn fp-btn--lg"
          >
            <MessageCircle size={16} aria-hidden /> {t('chat_whatsapp')}
          </a>
        </div>
      </section>

      <div className="fp-section">
        <h3 className="fp-section__title fp-section__title--icon">
          <span className="fp-brand-mark fp-brand-mark--sm" aria-hidden>
            <HelpCircle size={14} />
          </span>
          {t('faq_section')}
        </h3>
      </div>

      <div className="fp-card-stack">
        {FAQS.map((id) => {
          const expanded = openId === id
          const panelId = `${id}-panel`
          return (
            <article key={id} className={`fp-faq-row${expanded ? ' fp-faq-row--open' : ''}`}>
              <button
                type="button"
                className="fp-faq-row__head"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : id)}
              >
                <h4 className="fp-faq-row__title">{t(`${id}_q`)}</h4>
                <ChevronDown
                  size={20}
                  className={`fp-faq-row__chev${expanded ? ' fp-faq-row__chev--open' : ''}`}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <p id={panelId} className="fp-faq-row__text">
                  {t(`${id}_a`)}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
