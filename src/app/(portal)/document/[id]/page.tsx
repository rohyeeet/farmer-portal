'use client'

import { use } from 'react'
import DocumentViewScreen from '../../../../screens/DocumentViewScreen'

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <DocumentViewScreen docId={id} />
}
