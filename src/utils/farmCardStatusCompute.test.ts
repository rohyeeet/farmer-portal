import { describe, expect, it } from 'vitest'
import {
  aggregateKyaariStatuses,
  combineStatuses,
  computeCraConsentStatus,
  computeFarmEligibility,
  normalizeVerificationStatus,
} from './farmCardStatusCompute'
import type { FarmDocumentBucket, FarmMediaDoc } from '../types/farmDocuments.api'
import type { KyaariModule } from '../types/kyaari.api'

const doc = (subType: string, status: string | null, withUrl = true): FarmMediaDoc => ({
  id: 1,
  refType: 'AgroFarm',
  refSubType: subType,
  mediaUrl: withUrl ? 'https://x/y.pdf' : null,
  contentType: 'application/pdf',
  filename: 'x.pdf',
  verificationStatus: status,
  verificationRemarks: null,
  createdDatetime: 1700000000,
  metadata: null,
  geoLocation: null,
  geminiResult: null,
})

const bucket = (subType: string, docs: FarmMediaDoc[]): FarmDocumentBucket => ({
  refSubType: subType,
  label: subType,
  docs,
})

const ky = (status: KyaariModule['verificationStatus']): KyaariModule => ({
  kyaariId: 'k',
  kyaariName: 'Kyaari',
  areaAcres: 1,
  treeCount: 100,
  verificationStatus: status,
})

describe('normalizeVerificationStatus', () => {
  it('treats APPROVED as ACCEPTED', () => {
    expect(normalizeVerificationStatus('APPROVED')).toBe('ACCEPTED')
  })
  it('treats IN_PROGRESS as PENDING', () => {
    expect(normalizeVerificationStatus('IN_PROGRESS')).toBe('PENDING')
  })
  it('treats null/empty as MISSING', () => {
    expect(normalizeVerificationStatus(null)).toBe('MISSING')
    expect(normalizeVerificationStatus('')).toBe('MISSING')
  })
  it('treats unknown values as PENDING (never silently ACCEPTED)', () => {
    expect(normalizeVerificationStatus('FOO')).toBe('PENDING')
  })
})

describe('combineStatuses — priority cascade', () => {
  it('returns ACCEPTED only when all are ACCEPTED', () => {
    expect(combineStatuses(['ACCEPTED', 'ACCEPTED', 'ACCEPTED'])).toBe('ACCEPTED')
  })
  it('REJECTED wins over PENDING', () => {
    expect(combineStatuses(['ACCEPTED', 'REJECTED', 'PENDING'])).toBe('REJECTED')
  })
  it('REJECTED wins over MISSING', () => {
    expect(combineStatuses(['REJECTED', 'MISSING', 'MISSING'])).toBe('REJECTED')
  })
  it('PENDING wins over MISSING', () => {
    expect(combineStatuses(['ACCEPTED', 'PENDING', 'MISSING'])).toBe('PENDING')
  })
  it('all MISSING ⇒ MISSING', () => {
    expect(combineStatuses(['MISSING', 'MISSING', 'MISSING'])).toBe('MISSING')
  })
  it('empty array ⇒ MISSING', () => {
    expect(combineStatuses([])).toBe('MISSING')
  })
})

describe('aggregateKyaariStatuses — any-accepted rule', () => {
  it('a single ACCEPTED kyaari ⇒ ACCEPTED regardless of others', () => {
    expect(
      aggregateKyaariStatuses([ky('ACCEPTED'), ky('PENDING'), ky('REJECTED')]),
    ).toBe('ACCEPTED')
  })
  it('no ACCEPTED ⇒ REJECTED wins over PENDING', () => {
    expect(aggregateKyaariStatuses([ky('REJECTED'), ky('PENDING')])).toBe('REJECTED')
  })
  it('no ACCEPTED/REJECTED ⇒ PENDING', () => {
    expect(aggregateKyaariStatuses([ky('PENDING'), ky('MISSING')])).toBe('PENDING')
  })
  it('empty list ⇒ MISSING', () => {
    expect(aggregateKyaariStatuses([])).toBe('MISSING')
  })
})

describe('computeFarmEligibility', () => {
  const land = (status: string) =>
    bucket('AgroFarmLandRecord', [doc('AgroFarmLandRecord', status)])

  it('returns ACCEPTED when land + eKYC + any kyaari are all ACCEPTED', () => {
    expect(
      computeFarmEligibility([land('ACCEPTED')], 'ACCEPTED', [
        ky('ACCEPTED'),
        ky('PENDING'),
      ]),
    ).toBe('ACCEPTED')
  })
  it('returns REJECTED when land doc REJECTED, even if eKYC ACCEPTED', () => {
    expect(
      computeFarmEligibility([land('REJECTED')], 'ACCEPTED', [ky('ACCEPTED')]),
    ).toBe('REJECTED')
  })
  it('returns REJECTED when eKYC REJECTED, even if land + kyaari ACCEPTED', () => {
    expect(
      computeFarmEligibility([land('ACCEPTED')], 'REJECTED', [ky('ACCEPTED')]),
    ).toBe('REJECTED')
  })
  it('returns PENDING when eKYC is IN_PROGRESS and nothing is REJECTED', () => {
    expect(
      computeFarmEligibility([land('ACCEPTED')], 'IN_PROGRESS', [ky('ACCEPTED')]),
    ).toBe('PENDING')
  })
  it('returns MISSING when nothing is set up', () => {
    expect(computeFarmEligibility([], 'MISSING', [])).toBe('MISSING')
  })
})

describe('computeCraConsentStatus', () => {
  it('MISSING when there is no CRA bucket', () => {
    expect(computeCraConsentStatus([])).toBe('MISSING')
  })
  it('MISSING when CRA bucket has docs but no mediaUrl', () => {
    expect(
      computeCraConsentStatus([
        bucket('AgroFarmDigitalCRA', [doc('AgroFarmDigitalCRA', 'ACCEPTED', false)]),
      ]),
    ).toBe('MISSING')
  })
  it('ACCEPTED when latest CRA doc is ACCEPTED with mediaUrl', () => {
    expect(
      computeCraConsentStatus([
        bucket('AgroFarmDigitalCRA', [doc('AgroFarmDigitalCRA', 'ACCEPTED')]),
      ]),
    ).toBe('ACCEPTED')
  })
  it('passes through PENDING / REJECTED on the CRA doc', () => {
    expect(
      computeCraConsentStatus([
        bucket('AgroFarmDigitalCRA', [doc('AgroFarmDigitalCRA', 'PENDING')]),
      ]),
    ).toBe('PENDING')
    expect(
      computeCraConsentStatus([
        bucket('AgroFarmDigitalCRA', [doc('AgroFarmDigitalCRA', 'REJECTED')]),
      ]),
    ).toBe('REJECTED')
  })
})
