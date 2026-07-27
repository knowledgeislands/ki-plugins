import type { AuditOutcome, RubricContextOptions, RubricOutcomes, RubricSession } from '../../shared/rubric.ts'
import { createRoadmapDraft } from './roadmap-drafts.ts'
import { type Finding, inspectRoadmap } from './roadmap-evidence.ts'

export type RoadmapAuditContext = {
  readonly findings: readonly Finding[]
}

export type RoadmapBlurbsContext = RoadmapAuditContext & {
  readonly normaliseHorizonBlurbs?: () => void
}

export type RoadmapPlanContext = RoadmapAuditContext & {
  readonly syncPlanReferences?: () => void
}

export type RoadmapProjectionContext = RoadmapAuditContext & {
  readonly rebuildProjection?: () => void
}

export type RoadmapRubricContext = {
  readonly scope: RoadmapAuditContext
  readonly profile: RoadmapAuditContext
  readonly roadmaps: RoadmapBlurbsContext
  readonly themes: RoadmapAuditContext
  readonly items: RoadmapAuditContext
  readonly projection: RoadmapProjectionContext
  readonly plans: RoadmapPlanContext
  readonly safety: RoadmapAuditContext
  readonly expansion: RoadmapAuditContext
  readonly handoffs: RoadmapAuditContext
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

export const outcomesFor = (context: RoadmapAuditContext, code: string, passMessage: string): RubricOutcomes<AuditOutcome> => {
  const outcomes = context.findings.filter((finding) => finding.area === code).map(auditOutcome)
  return outcomes.length > 0 ? outcomes : [{ status: 'PASS', message: passMessage }]
}

export const createRoadmapSession = ({ mode, repository }: RubricContextOptions): RubricSession<RoadmapRubricContext> => {
  const findings = inspectRoadmap(repository)
  const draft = mode === 'conform' ? createRoadmapDraft(repository, findings) : undefined
  const audit = { findings }
  const context: RoadmapRubricContext = {
    scope: audit,
    profile: audit,
    roadmaps: { ...audit, ...(draft ? { normaliseHorizonBlurbs: draft.normaliseHorizonBlurbs } : {}) },
    themes: audit,
    items: audit,
    projection: { ...audit, ...(draft ? { rebuildProjection: draft.rebuildProjection } : {}) },
    plans: { ...audit, ...(draft ? { syncPlanReferences: draft.syncPlanReferences } : {}) },
    safety: audit,
    expansion: audit,
    handoffs: audit
  }

  return {
    subjects: [
      {
        families: ['SCOPE', 'PROFILE', 'ROAD', 'THEME', 'ITEM', 'PROJ', 'PLAN', 'SAFE', 'EXPAND', 'HANDOFF'],
        context: () => context
      }
    ],
    proposal: () => draft?.proposal() ?? { writes: [] }
  }
}
