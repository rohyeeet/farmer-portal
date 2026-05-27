import type { NextConfig } from 'next'

function devProxyTarget(): string {
  return (process.env.DEV_PROXY_TARGET ?? 'http://localhost:8000').trim().replace(/\/+$/, '')
}

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'artifacts-varaha-test.s3.amazonaws.com',
      },
    ],
  },
  async rewrites() {
    const t = devProxyTarget()
    return [
      // ── Auth (all @csrf_exempt on backend) ───────────────────────────────
      { source: '/api/mobile/v2/login-otp/', destination: `${t}/api/mobile/v2/login-otp/` },
      { source: '/api/mobile/v2/login-otp/resend/', destination: `${t}/api/mobile/v2/login-otp/resend/` },
      { source: '/api/mobile/v2/login-validate/', destination: `${t}/api/mobile/v2/login-validate/` },
      { source: '/api/mobile/v2/logout/', destination: `${t}/api/mobile/v2/logout/` },

      // ── Farmer profile list (GET only, no CSRF needed) ───────────────────
      { source: '/api/mobile/v2/farmer/', destination: `${t}/api/mobile/v2/farmer/` },

      // ── Farm / media / kyaari listings (GET, no CSRF needed) ─────────────
      { source: '/api/mobile/v2/farm/:path*', destination: `${t}/api/mobile/v2/farm/:path*/` },
      { source: '/api/mobile/v2/agfarm/:path*', destination: `${t}/api/mobile/v2/agfarm/:path*/` },
      { source: '/api/mobile/v2/media/:path*', destination: `${t}/api/mobile/v2/media/:path*/` },
      { source: '/api/mobile/v2/kyari/:path*', destination: `${t}/api/mobile/v2/kyari/:path*/` },

      // ── Core ─────────────────────────────────────────────────────────────
      { source: '/core/:path*', destination: `${t}/core/:path*/` },

      // ── INTENTIONALLY ABSENT from rewrites (handled by CSRF proxy handlers)
      //    /api/mobile/v2/farmer/:path+  →  src/app/api/mobile/v2/farmer/[...path]/route.ts
      //    /bre/:path*                   →  src/app/bre/[...path]/route.ts  (→ KYC_PROXY_TARGET for all KYC+BAV)
    ]
  },
}

export default nextConfig
