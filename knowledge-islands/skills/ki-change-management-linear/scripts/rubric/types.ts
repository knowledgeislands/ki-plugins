import type {
  AuditOutcome,
  RubricContextOptions,
  RubricFamily,
  RubricSession,
  SkillRubricDefinition
} from '../shared/rubric.ts'

export type { AuditOutcome, RubricContextOptions, RubricFamily, RubricSession, SkillRubricDefinition }

export type LinearRubricContext = {
  selection: { outcomes: readonly AuditOutcome[] }
}
