import { expect, test } from 'bun:test'
import { resolve } from 'node:path'
import { inventoryRemediation, PROMOTION_REVIEW, reportOnlyDisposition } from './remediation-inventory.ts'

const repository = resolve(import.meta.dir, '../../../../..')

test('source-loaded remediation inventory covers every structured criterion exactly once', async () => {
  const inventory = await inventoryRemediation(repository)

  expect(inventory.issues).toEqual([])
  expect(inventory.counts).toEqual({
    catalogues: 48,
    criteria: 664,
    mechanical: 453,
    judgment: 248,
    hybrid: 37,
    automatic: 97,
    diagnostic: 344,
    guarded: 12
  })
  expect(inventory.counts.mechanical).toBe(
    inventory.counts.automatic + inventory.counts.diagnostic + inventory.counts.guarded
  )
  expect(new Set(inventory.entries.map(({ skill, criterion }) => `${skill}/${criterion}`)).size).toBe(
    inventory.entries.length
  )

  const byIdentity = new Map(inventory.entries.map((entry) => [`${entry.skill}/${entry.criterion}`, entry]))
  expect(PROMOTION_REVIEW).toHaveLength(6)
  for (const review of PROMOTION_REVIEW) {
    const entry = byIdentity.get(`${review.skill}/${review.criterion}`)
    expect(entry?.remediation).toBe(review.disposition === 'promoted' ? 'automatic' : 'diagnostic')
    expect(review.rationale.trim()).not.toBe('')
  }

  const reportOnly = inventory.entries.filter(
    ({ remediation }) => remediation === 'diagnostic' || remediation === 'guarded'
  )
  expect(reportOnly).toHaveLength(356)
  expect(reportOnly.filter((entry) => reportOnlyDisposition(entry) === 'candidate-deferred')).toHaveLength(0)
  expect(reportOnly.filter((entry) => reportOnlyDisposition(entry) === 'justified-boundary')).toHaveLength(356)
})
