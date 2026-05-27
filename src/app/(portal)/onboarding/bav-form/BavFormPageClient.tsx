'use client'

import { Suspense } from 'react'
import BavFormScreen from '../../../../screens/onboarding/BavFormScreen'

export default function BavFormPageClient() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <BavFormScreen />
    </Suspense>
  )
}
