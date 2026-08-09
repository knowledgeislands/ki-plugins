import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ConformProposal, ConformWrite } from '../../shared/rubric.ts'
import { type Finding, ISSUE_LEDGER, issueLedger, rootRoadmap, workItemsFor } from './roadmap-evidence.ts'

export type RoadmapDraft = {
  normaliseRoot: () => void
  scaffoldIssueLedger: () => void
  proposal: () => ConformProposal
}

const safeToDraft = (repository: string, findings: readonly Finding[]): boolean => {
  const ledgerMissing = !existsSync(join(repository, 'docs', 'roadmap', ISSUE_LEDGER))
  return !findings.some(
    (finding) => finding.level === 'FAIL' && finding.area !== 'ROOT-1' && !(finding.area === 'ROAD-7' && ledgerMissing)
  )
}

export const createRoadmapDraft = (_repository: string, findings: readonly Finding[]): RoadmapDraft | undefined => {
  if (!safeToDraft(_repository, findings)) return undefined
  const writes: ConformWrite[] = []
  const addWrite = (path: string, content: string): void => {
    if (!writes.some((write) => write.path === path)) writes.push({ path, content })
  }
  const scaffoldIssueLedger = (): void => {
    if (existsSync(join(_repository, 'docs', 'roadmap', ISSUE_LEDGER))) return
    const items = workItemsFor(_repository)
    const areas = new Map<string, number>()
    for (const item of items) {
      if (!item.area) continue
      areas.set(item.area, Math.max(areas.get(item.area) ?? 0, item.serial))
    }
    const highestRetained = Math.max(0, ...items.map((item) => item.serial))
    addWrite(`docs/roadmap/${ISSUE_LEDGER}`, issueLedger(areas.size ? areas : highestRetained))
  }
  return {
    normaliseRoot: () => {
      addWrite('ROADMAP.md', rootRoadmap())
    },
    scaffoldIssueLedger,
    proposal: () => ({ writes })
  }
}
