import { describe, expect, it } from 'vitest'
import { isValidPhoneNumber } from './phone'

describe('isValidPhoneNumber', () => {
  it('accepts valid Indian mobile', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true)
  })

  it('rejects invalid start digit', () => {
    expect(isValidPhoneNumber('5876543210')).toBe(false)
  })
})
