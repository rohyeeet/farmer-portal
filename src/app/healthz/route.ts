import { NextResponse } from 'next/server'

/** Liveness for Docker / Kubernetes (replaces nginx `/healthz`). */
export function GET() {
  return new NextResponse('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
