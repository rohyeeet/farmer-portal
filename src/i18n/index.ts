'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import kn from './locales/kn.json'
import ta from './locales/ta.json'
import { readStoredLanguage } from '../utils/bootstrapMapping'

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  kn: { translation: kn },
  ta: { translation: ta },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: typeof window !== 'undefined' ? readStoredLanguage() : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
} else {
  // Merge updated JSON into the live instance (handles Next.js HMR without
  // a full server restart when new translation keys are added).
  for (const [lng, { translation }] of Object.entries(resources)) {
    i18n.addResourceBundle(lng, 'translation', translation, true, true)
  }
}

export default i18n
