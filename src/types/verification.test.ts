import { describe, expect, it } from 'vitest'
import { isFullyVerified, needsVerificationRemediation } from './verification.types'

describe('verification routing', () => {
  it('fully verified when all accepted', () => {
    expect(isFullyVerified(true, 'ACCEPTED', 'ACCEPTED')).toBe(true)
  })

  it('needs remediation when ekyc missing', () => {
    expect(needsVerificationRemediation('MISSING', 'ACCEPTED')).toBe(true)
  })

  it('home route when fully verified', () => {
    expect(isFullyVerified(true, 'ACCEPTED', 'ACCEPTED')).toBe(true)
  })
})
