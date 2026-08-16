export type AuditOutcome = {
  status: 'PASS' | 'VIOLATION' | 'NOT_APPLICABLE' | 'INFO'
  message: string
  subject?: string
  level?: 'FAIL' | 'WARN'
}

export type RubricPublicationContext = { publication?: unknown }

export type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]]

export type MechanicalRemediation = { class: 'automatic' } | { class: 'diagnostic' | 'guarded'; guidance: string }

export type JudgmentRubric = {
  scope: string
  prompt: string
  outcomes: NonEmptyReadonlyArray<string>
  guidance: string
}

export type RubricContextOptions = {
  mode: 'audit' | 'conform'
  repository: string
  userHome: string
  configuration: Readonly<Record<string, unknown>>
  publication?: unknown
}

export type RubricSession<Context> = {
  subjects: readonly { families: readonly string[]; context: () => Context }[]
  proposal: () => { writes: readonly unknown[] }
}

export type RubricFamily<Root, Selected> = {
  code: string
  title: string
  description: string
  standard: string
  selectContext: (root: Root) => Selected
  items: readonly {
    code: string
    title: string
    description: string
    sources: readonly string[]
    mechanical: {
      level: 'FAIL' | 'WARN'
      remediation: MechanicalRemediation
      audit: { phase: 'INSPECT'; run: (context: Selected) => readonly AuditOutcome[] }
    }
    judgment?: JudgmentRubric
  }[]
}

export type SkillRubricDefinition<Context> = {
  contract: 1
  name: string
  concern: string
  createSession: (options: RubricContextOptions) => RubricSession<Context>
  families: readonly {
    code: string
    title: string
    description: string
    standard: string
    selectContext: (root: Context) => unknown
    items: readonly unknown[]
  }[]
}
