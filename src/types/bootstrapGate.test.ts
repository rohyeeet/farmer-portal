import { describe, expect, it } from 'vitest'
import {
  isFullyVerified,
  needsVerificationRemediation,
} from './verification.types'

describe('post-login routing', () => {
  it('sends user to onboarding when identity not confirmed', () => {
    expect(
      isFullyVerified(false, 'ACCEPTED', 'ACCEPTED'),
    ).toBe(false)
  })

  it('allows home when fully verified', () => {
    expect(
      isFullyVerified(true, 'ACCEPTED', 'ACCEPTED'),
    ).toBe(true)
  })

  it('needs onboarding when bav missing', () => {
    expect(needsVerificationRemediation('ACCEPTED', 'MISSING')).toBe(true)
  })
})
