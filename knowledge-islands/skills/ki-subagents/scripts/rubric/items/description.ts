import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const DESCRIPTION_MAX = 1024
const stripCode = (markdown: string): string => markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
const inspect = (
  context: AgentFileContext,
  run: (agent: NonNullable<AgentFileContext['agent']>) => readonly AuditOutcome[]
): readonly AuditOutcome[] =>
  context.agent ? run(context.agent) : [{ status: 'NOT_APPLICABLE', message: 'No physical agent definition is available.' }]

const DESC_1: RubricItem<AgentFileContext> = {
  code: 'DESC-1',
  title: 'Description present',
  description: 'description is present and non-empty.',
  sources: [`${STANDARD}#4-frontmatter-description`, 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => [
          agent.frontmatter.raw === null
            ? { status: 'NOT_APPLICABLE', message: 'Frontmatter is absent.', subject: agent.file }
            : {
                status: agent.description?.trim() ? 'PASS' : 'VIOLATION',
                message: agent.description?.trim() ? 'description is present.' : 'description is missing or empty.',
                subject: agent.file
              }
        ])
    }
  }
}

const DESC_2: RubricItem<AgentFileContext> = {
  code: 'DESC-2',
  title: 'Description soft length cap',
  description: 'description is at most approximately 1024 characters.',
  sources: [`${STANDARD}#4-frontmatter-description`, 'BP'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => [
          agent.description === undefined
            ? { status: 'NOT_APPLICABLE', message: 'description is absent.', subject: agent.file }
            : {
                status: agent.description.length <= DESCRIPTION_MAX ? 'PASS' : 'VIOLATION',
                message: `description is ${agent.description.length} chars (recommended ≤ ${DESCRIPTION_MAX}).`,
                subject: agent.file
              }
        ])
    }
  }
}

const DESC_3: RubricItem<AgentFileContext> = {
  code: 'DESC-3',
  title: 'Description XML safety',
  description: 'description contains no XML tags.',
  sources: [`${STANDARD}#4-frontmatter-description`, 'BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => [
          agent.description === undefined
            ? { status: 'NOT_APPLICABLE', message: 'description is absent.', subject: agent.file }
            : {
                status: /<\/?[a-zA-Z][^>]*>/.test(stripCode(agent.description)) ? 'VIOLATION' : 'PASS',
                message: 'description contains no XML tags.',
                subject: agent.file
              }
        ])
    }
  }
}

const judgments: readonly RubricItem<AgentFileContext>[] = [
  {
    code: 'DESC-4',
    title: 'Ownership and delegation signal',
    description: 'The description states both what the agent owns and when to delegate to it.',
    sources: [`${STANDARD}#4-frontmatter-description`, 'CC', 'BP'],
    judgment: { prompt: 'States both what the agent owns and when to delegate to it.' }
  },
  {
    code: 'DESC-5',
    title: 'Third-person description',
    description: 'The description is written in the third person, never first or second person.',
    sources: [`${STANDARD}#4-frontmatter-description`, 'BP'],
    judgment: { prompt: 'Written in the third person, never first/second person.' }
  },
  {
    code: 'DESC-6',
    title: 'Concrete request cues',
    description: 'The description includes concrete cues a request would carry.',
    sources: [`${STANDARD}#4-frontmatter-description`, 'CC', 'BP'],
    judgment: { prompt: "Includes concrete cues a request would carry (the role's nouns/verbs)." }
  },
  {
    code: 'DESC-7',
    title: 'Specific description',
    description: 'The description avoids vague phrasing such as helps with engineering.',
    sources: [`${STANDARD}#4-frontmatter-description`, 'BP'],
    judgment: { prompt: 'Avoids vague phrasing ("helps with engineering").' }
  }
]

export const DESC: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'DESC',
  title: 'Frontmatter description',
  description: 'The agent delegation signal.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [DESC_1, DESC_2, DESC_3, ...judgments]
}
