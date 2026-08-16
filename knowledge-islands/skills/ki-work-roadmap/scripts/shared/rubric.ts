/** Generic identity, execution, and catalogue model for structured governance rubrics. */

export const RUBRIC_MODES = ['audit', 'conform'] as const
export type RubricMode = (typeof RUBRIC_MODES)[number]

export const RUBRIC_PHASES = ['PREPARE', 'INSPECT', 'PRIMARY', 'DERIVED', 'NORMALISE'] as const
export type RubricPhase = (typeof RUBRIC_PHASES)[number]

export const VIOLATION_LEVELS = ['FAIL', 'WARN'] as const
export type ViolationLevel = (typeof VIOLATION_LEVELS)[number]

export const RUBRIC_TYPES = ['MECHANICAL', 'JUDGMENT'] as const
export type RubricType = (typeof RUBRIC_TYPES)[number]

export const OUTCOME_STATUSES = ['PASS', 'VIOLATION', 'NOT_APPLICABLE', 'INFO', 'FIXED'] as const
export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number]
export type AuditOutcomeStatus = Exclude<OutcomeStatus, 'FIXED'>
export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]]

type RubricOutcomeBase<Status extends OutcomeStatus> = {
  status: Status
  message: string
  subject?: string
}

export type RubricOutcome<Status extends OutcomeStatus> = Status extends 'VIOLATION'
  ? RubricOutcomeBase<Status> & { level?: ViolationLevel }
  : RubricOutcomeBase<Status> & { level?: never }

export type AuditOutcome = RubricOutcome<AuditOutcomeStatus>
export type ConformOutcome = RubricOutcome<OutcomeStatus>
/** A rubric execution may emit one outcome per inspected subject, including none when there are no subjects. */
export type RubricOutcomes<Result> = readonly Result[]

export type RubricExecution<Context, Result> = {
  phase: RubricPhase
  run: (context: Context) => Result
}

export type ConformWrite = {
  path: string
  content: string
  create?: boolean
}

export type ConformCommand = {
  program: string
  arguments: readonly string[]
}

export type ConformProposal = {
  writes: readonly ConformWrite[]
  commands?: readonly ConformCommand[]
}

type MechanicalRubricBase<Context> = {
  level: ViolationLevel
  /**
   * Relative expected effort against the other criteria in the same catalogue, used to
   * weight progress. Unset means one unit, so a rubric declares this only where an item is
   * materially cheaper or dearer than its siblings — a subprocess-backed check beside a
   * single `lstat`. It is the item's own estimate of itself, not a measurement, and it means
   * nothing except as a ratio.
   */
  cost?: number
  overrideLevels?: readonly ViolationLevel[]
  heuristic?: boolean
  audit: RubricExecution<Context, RubricOutcomes<AuditOutcome>>
}

export type AutomaticMechanicalRubric<Context> = MechanicalRubricBase<Context> & {
  remediation: { class: 'automatic' }
  /**
   * The canonical CONFORM action. It changes only the operation-scoped
   * in-memory context; the host publishes the session's final proposal.
   */
  conform: RubricExecution<Context, void>
  /** Additional neutral outcomes that this conform action may safely address. */
  conformOn?: readonly Extract<AuditOutcomeStatus, 'INFO'>[]
}

export type DiagnosticMechanicalRubric<Context> = MechanicalRubricBase<Context> & {
  remediation: { class: 'diagnostic'; guidance: string }
  conform?: never
  conformOn?: never
}

export type GuardedMechanicalRubric<Context> = MechanicalRubricBase<Context> & {
  remediation: { class: 'guarded'; guidance: string }
  conform?: never
  conformOn?: never
}

export type MechanicalRubric<Context> =
  | AutomaticMechanicalRubric<Context>
  | DiagnosticMechanicalRubric<Context>
  | GuardedMechanicalRubric<Context>

export type MechanicalRemediation = MechanicalRubric<never>['remediation']

/** A deterministic finding whose correct repair needs authorship or a local decision. */
export const DIAGNOSTIC_REMEDIATION = {
  class: 'diagnostic',
  guidance: 'Use the finding and this criterion to make the appropriate local change, then rerun the audit.'
} as const

/** A deterministic finding with a safe, idempotent host-executed repair. */
export const AUTOMATIC_REMEDIATION = { class: 'automatic' } as const

export type JudgmentRubric = {
  scope: string
  prompt: string
  outcomes: NonEmptyReadonlyArray<string>
  guidance: string
}

/** Common review metadata for criteria that differ only by their question. */
export const judgment = (prompt: string): JudgmentRubric => ({
  scope: 'The target skill and the evidence named by this criterion.',
  prompt,
  outcomes: ['conforming', 'gap', 'exclusion'],
  guidance: 'Record the review as conforming, a named Gap with its next action, or an explicit justified exclusion.'
})

export type RubricItemBase = {
  code: string
  title: string
  description: string
  sources: NonEmptyReadonlyArray<string>
}

export type RubricItem<Context> = RubricItemBase &
  (
    | {
        mechanical: AutomaticMechanicalRubric<Context> | DiagnosticMechanicalRubric<Context>
        judgment?: JudgmentRubric
      }
    | {
        mechanical: GuardedMechanicalRubric<Context>
        judgment: JudgmentRubric
      }
    | {
        mechanical?: never
        judgment: JudgmentRubric
      }
  )

export type RubricFamily<RootContext, FamilyContext> = {
  code: string
  title: string
  description: string
  standard: string
  selectContext: (root: RootContext) => FamilyContext
  items: readonly RubricItem<FamilyContext>[]
}

type CatalogueRubricFamily<RootContext> = {
  code: string
  title: string
  description: string
  standard: string
  selectContext: (root: RootContext) => unknown
  /** `never` erases heterogeneous family contexts without making callbacks callable. */
  items: readonly RubricItem<never>[]
}

export type RubricDefinition<RootContext> = {
  name: string
  concern: string
  families: readonly CatalogueRubricFamily<RootContext>[]
}

export type RepositorySkillActivationState = {
  name: string
  status: 'active' | 'missing' | 'blocked'
  message: string
}

/**
 * Host-owned evidence and proposal seam for managed repository-skill activation.
 *
 * A rubric may derive the exact required skill names, inspect their host-resolved state,
 * and request one native activation proposal. It receives no filesystem or subprocess
 * capability and cannot select a provider or alter user configuration.
 */
export type RepositorySkillActivation = {
  inspect: (names: readonly string[]) => readonly RepositorySkillActivationState[]
  propose: (names: readonly string[]) => void
}

export type RubricContextOptions = {
  mode: RubricMode
  repository: string
  userHome: string
  configuration: Readonly<Record<string, unknown>>
  /**
   * Reports progress while the session works. Absent when the host is not displaying
   * progress; a rubric must produce identical findings either way and must never depend on
   * an emitted event being observed.
   */
  emit?: RubricEmitter
  /** Host-validated generated-publication evidence for this skill's catalogue, when requested. */
  publication?: RubricPublication
  /** Host-resolved repository-skill activation evidence and native proposal capability. */
  repositorySkills?: RepositorySkillActivation
}

/**
 * A progress report from inside a rubric session.
 *
 * `stage` brackets a named span of work — gathering evidence for a subject, or executing one
 * criterion — and `step` reports movement within the current span. `completed` and `total`
 * are supplied together or not at all and describe countable work such as files scanned.
 */
export type RubricProgressEvent =
  | { kind: 'stage'; edge: 'start' | 'end'; label: string; code?: string }
  | { kind: 'step'; label: string; code?: string; completed?: number; total?: number }

export type RubricEmitter = (event: RubricProgressEvent) => void

export type RubricPublicationState = 'in-sync' | 'missing' | 'stale'

/**
 * A criterion-agnostic capability for a skill's derived rubric publication.
 *
 * The host determines the canonical bytes and controls the resulting write. A
 * rubric may inspect the evidence and request publication during CONFORM, but
 * it cannot select a path or replacement content.
 */
export type RubricPublication = {
  target: string
  rendered: string
  existing?: string
  state: RubricPublicationState
  propose: () => void
}

/** Focused evidence supplied to a rubric-publication family by its session. */
export type RubricPublicationContext = {
  publication?: RubricPublication
}

export type RubricSubject<RootContext> = {
  context: () => RootContext
  families: readonly string[]
  subject?: string
}

export type RubricSession<RootContext> = {
  subjects: readonly RubricSubject<RootContext>[]
  proposal: () => ConformProposal
}

export type SkillRubricDefinition<RootContext> = RubricDefinition<RootContext> & {
  contract: 1
  /**
   * The host awaits this, so a skill may gather evidence asynchronously and yield the event
   * loop while it does. A synchronous session stays valid and assignable, which is what lets
   * each skill move at its own pace: a skill becomes async only when it has a reason to.
   */
  createSession: (options: RubricContextOptions) => RubricSession<RootContext> | Promise<RubricSession<RootContext>>
}

export const defineRubricFamily = <RootContext, FamilyContext>(
  family: RubricFamily<RootContext, FamilyContext>
): RubricFamily<RootContext, FamilyContext> => family

/**
 * The uniform derived-publication policy for a structured rubric catalogue.
 *
 * The host owns rendered bytes and the guarded write. A skill supplies only
 * its focused publication evidence and selects the corresponding subject.
 */
export const createRubricPublicationFamily = <RootContext>(
  selectContext: (root: RootContext) => RubricPublicationContext,
  standard: string,
  sources: NonEmptyReadonlyArray<string>
): RubricFamily<RootContext, RubricPublicationContext> => ({
  code: 'RUBRIC',
  title: 'Generated rubric publication',
  description: 'The tracked readable rubric is the exact publication of the structured catalogue.',
  standard,
  selectContext,
  items: [
    {
      code: 'RUBRIC-1',
      title: 'structured catalogue publication is exact',
      description:
        'A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes.',
      sources,
      mechanical: {
        level: 'FAIL',
        remediation: AUTOMATIC_REMEDIATION,
        audit: {
          phase: 'DERIVED',
          run: ({ publication }) => {
            if (!publication)
              return [
                {
                  status: 'VIOLATION',
                  message: 'the host did not provide generated-publication evidence for this structured catalogue'
                }
              ]
            if (publication.state === 'in-sync')
              return [{ status: 'PASS', message: 'the structured catalogue publication is exact' }]
            return [
              {
                status: 'VIOLATION',
                message:
                  publication.state === 'missing'
                    ? '`references/rubric.md` is missing from the structured catalogue'
                    : '`references/rubric.md` differs from the structured catalogue'
              }
            ]
          }
        },
        conform: {
          phase: 'DERIVED',
          run: ({ publication }) => {
            if (publication && publication.state !== 'in-sync') publication.propose()
          }
        }
      }
    }
  ]
})

export const rubricTypes = <Context>(item: RubricItem<Context>): readonly RubricType[] => [
  ...(item.mechanical ? (['MECHANICAL'] as const) : []),
  ...(item.judgment ? (['JUDGMENT'] as const) : [])
]
