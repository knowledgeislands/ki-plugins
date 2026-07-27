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

export type MechanicalRubric<Context> = {
  level: ViolationLevel
  overrideLevels?: readonly ViolationLevel[]
  heuristic?: boolean
  audit: RubricExecution<Context, RubricOutcomes<AuditOutcome>>
  /**
   * The canonical CONFORM action. It changes only the operation-scoped
   * in-memory context; the host publishes the session's final proposal.
   */
  conform?: RubricExecution<Context, void>
  /** Additional neutral outcomes that this conform action may safely address. */
  conformOn?: readonly Extract<AuditOutcomeStatus, 'INFO'>[]
}

export type JudgmentRubric = {
  prompt: string
}

export type RubricItemBase = {
  code: string
  title: string
  description: string
  sources: NonEmptyReadonlyArray<string>
}

export type RubricItem<Context> = RubricItemBase &
  (
    | {
        mechanical: MechanicalRubric<Context>
        judgment?: JudgmentRubric
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

export type RubricContextOptions = {
  mode: RubricMode
  repository: string
  userHome: string
  configuration: Readonly<Record<string, unknown>>
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
  createSession: (options: RubricContextOptions) => RubricSession<RootContext>
}

export const defineRubricFamily = <RootContext, FamilyContext>(
  family: RubricFamily<RootContext, FamilyContext>
): RubricFamily<RootContext, FamilyContext> => family

export const rubricTypes = <Context>(item: RubricItem<Context>): readonly RubricType[] => [
  ...(item.mechanical ? (['MECHANICAL'] as const) : []),
  ...(item.judgment ? (['JUDGMENT'] as const) : [])
]
