import { describe, expect, it } from 'vitest'
import { canViewLegalDocument } from './documentGating'

describe('canViewLegalDocument', () => {
  it('locks CRA when ekyc not accepted', () => {
    const r = canViewLegalDocument('MISSING', 'ACCEPTED', true)
    expect(r.allowed).toBe(false)
    expect(r.state).toBe('LOCKED_BY_EKYC')
  })

  it('allows land doc without ekyc', () => {
    const r = canViewLegalDocument('MISSING', 'ACCEPTED', false)
    expect(r.allowed).toBe(true)
  })
})
