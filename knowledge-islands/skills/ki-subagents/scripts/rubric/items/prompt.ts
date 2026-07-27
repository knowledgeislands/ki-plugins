import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'

const PROMPT_ITEMS = [
  {
    code: 'PROMPT-1',
    title: 'System-prompt body present',
    description: 'A non-empty system-prompt body follows the frontmatter.',
    sources: [`${STANDARD}#6-system-prompt-size--focus`, 'CC'],
    mechanical: {
      level: 'FAIL',
      audit: {
        phase: 'INSPECT',
        run: (context: AgentFileContext) => {
          const agent = context.agent
          if (!agent) return [{ status: 'NOT_APPLICABLE' as const, message: 'No physical agent definition is available.' }]
          return [
            agent.frontmatter.raw === null
              ? { status: 'NOT_APPLICABLE', message: 'Frontmatter is absent.', subject: agent.file }
              : {
                  status: agent.body.trim() ? 'PASS' : 'VIOLATION',
                  message: agent.body.trim() ? 'System-prompt body is present.' : 'No system-prompt body follows the frontmatter.',
                  subject: agent.file
                }
          ]
        }
      }
    }
  },
  {
    code: 'PROMPT-2',
    title: 'Role and lane opening',
    description: 'The system prompt opens with the role and lane: what it owns and what it does not.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: { prompt: 'Opens with role & lane — what it owns and, explicitly, what it does not.' }
  },
  {
    code: 'PROMPT-3',
    title: 'Grounding before action',
    description: 'The system prompt names sources to read and cite before acting.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: { prompt: 'Grounding: names the sources it must read before acting and requires citing them, not reasoning from memory.' }
  },
  {
    code: 'PROMPT-4',
    title: 'When-invoked procedure',
    description: 'The system prompt gives a short ordered clarify, read, reason, produce procedure.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: { prompt: 'A short ordered when-invoked procedure (clarify → read → reason → produce).' }
  },
  {
    code: 'PROMPT-5',
    title: 'Own-versus-defer boundary',
    description: 'The system prompt explicitly names sibling hand-offs.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: { prompt: 'An explicit own-vs-defer list naming the siblings it hands work to.' }
  },
  {
    code: 'PROMPT-6',
    title: 'Safe write guidance',
    description: 'A writing agent requires confirm-before-write and explains house conventions.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: { prompt: 'If it may write, requires confirm-before-write and house conventions, stating the why alongside each rule.' }
  },
  {
    code: 'PROMPT-7',
    title: 'Focused prompt',
    description: 'The system prompt stays focused on one role with consistent, useful terminology.',
    sources: [`${STANDARD}#6-system-prompt-size--focus`, `${STANDARD}#7-system-prompt-structure--quality`, 'BP'],
    judgment: { prompt: 'Focused on one role, consistent terminology, no token spent on what Claude already knows.' }
  }
] as const

export const PROMPT: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'PROMPT',
  title: 'System-prompt quality',
  description: 'System-prompt presence, structure, and focus.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [...PROMPT_ITEMS] as readonly RubricItem<AgentFileContext>[]
}
