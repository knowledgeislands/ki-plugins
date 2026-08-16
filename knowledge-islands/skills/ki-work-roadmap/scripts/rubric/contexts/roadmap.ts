import type {
  AuditOutcome,
  RubricContextOptions,
  RubricOutcomes,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'
import { createRoadmapDraft } from './roadmap-drafts.ts'
import { type Finding, inspectRoadmap } from './roadmap-evidence.ts'

export type RoadmapAuditContext = {
  readonly findings: readonly Finding[]
  readonly scaffoldIssueLedger?: () => void
}

export type RoadmapIndexContext = RoadmapAuditContext & {
  readonly normaliseRoot?: () => void
}

export type RoadmapRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly scope: RoadmapAuditContext
  readonly roadmaps: RoadmapAuditContext
  readonly items: RoadmapAuditContext
  readonly index: RoadmapIndexContext
  readonly execution: RoadmapAuditContext
  readonly safety: RoadmapAuditContext
  readonly trades: RoadmapAuditContext
}

const auditOutcome = (finding: Finding): AuditOutcome => ({
  status:
    finding.level === 'FAIL' || finding.level === 'WARN'
      ? 'VIOLATION'
      : finding.level === 'NA'
        ? 'NOT_APPLICABLE'
        : finding.level === 'INFO'
          ? 'INFO'
          : 'PASS',
  message: finding.msg,
  ...(finding.file ? { subject: finding.file } : {})
})

export const outcomesFor = (
  context: RoadmapAuditContext,
  code: string,
  passMessage: string
): RubricOutcomes<AuditOutcome> => {
  const outcomes = context.findings.filter((finding) => finding.area === code).map(auditOutcome)
  return outcomes.length > 0 ? outcomes : [{ status: 'PASS', message: passMessage }]
}

export const createRoadmapSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<RoadmapRubricContext> => {
  const findings = inspectRoadmap(repository)
  const draft = mode === 'conform' ? createRoadmapDraft(repository, findings) : undefined
  const audit = { findings }
  const context: RoadmapRubricContext = {
    rubric: { publication },
    scope: audit,
    roadmaps: { ...audit, ...(draft ? { scaffoldIssueLedger: draft.scaffoldIssueLedger } : {}) },
    items: audit,
    index: { ...audit, ...(draft ? { normaliseRoot: draft.normaliseRoot } : {}) },
    execution: audit,
    safety: audit,
    trades: audit
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      {
        families: ['SCOPE', 'ROAD', 'ITEM', 'INDEX', 'EXEC', 'SAFE', 'TRADE'],
        context: () => context
      }
    ],
    proposal: () => draft?.proposal() ?? { writes: [] }
  }
}
