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
      remediation: {
        class: 'diagnostic',
        guidance: 'Write a non-empty system prompt that states the agent’s role, lane, and operating guidance.'
      },
      audit: {
        phase: 'INSPECT',
        run: (context: AgentFileContext) => {
          const agent = context.agent
          if (!agent)
            return [{ status: 'NOT_APPLICABLE' as const, message: 'No physical agent definition is available.' }]
          return [
            agent.frontmatter.raw === null
              ? { status: 'NOT_APPLICABLE', message: 'Frontmatter is absent.', subject: agent.file }
              : {
                  status: agent.body.trim() ? 'PASS' : 'VIOLATION',
                  message: agent.body.trim()
                    ? 'System-prompt body is present.'
                    : 'No system-prompt body follows the frontmatter.',
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
    judgment: {
      scope: 'The system-prompt opening, role statement, and lane boundary.',
      prompt: 'Opens with role & lane — what it owns and, explicitly, what it does not.',
      outcomes: ['conforming', 'opening revision required', 'boundary clarification required'],
      guidance:
        'Open with a concise role and explicit owns/does-not-own lane statement, clarifying the boundary before adding more procedure.'
    }
  },
  {
    code: 'PROMPT-3',
    title: 'Grounding before action',
    description: 'The system prompt names sources to read and cite before acting.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: {
      scope: 'The prompt’s required sources, read-before-act ordering, and citation obligation.',
      prompt:
        'Grounding: names the sources it must read before acting and requires citing them, not reasoning from memory.',
      outcomes: ['conforming', 'grounding source required', 'citation guidance required'],
      guidance:
        'Name the authoritative sources, require reading them before action, and require the agent to cite the evidence it uses.'
    }
  },
  {
    code: 'PROMPT-4',
    title: 'When-invoked procedure',
    description: 'The system prompt gives a short ordered clarify, read, reason, produce procedure.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: {
      scope: 'The when-invoked procedure in the system prompt.',
      prompt: 'A short ordered when-invoked procedure (clarify → read → reason → produce).',
      outcomes: ['conforming', 'procedure revision required', 'step ordering required'],
      guidance:
        'Add a concise ordered procedure that clarifies the request, reads sources, reasons from evidence, and produces the bounded result.'
    }
  },
  {
    code: 'PROMPT-5',
    title: 'Own-versus-defer boundary',
    description: 'The system prompt explicitly names sibling hand-offs.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: {
      scope: 'The prompt’s own-versus-defer list and named sibling hand-offs.',
      prompt: 'An explicit own-vs-defer list naming the siblings it hands work to.',
      outcomes: ['conforming', 'handoff revision required', 'sibling routing required'],
      guidance: 'State what the agent owns and name the sibling capability for each out-of-lane hand-off.'
    }
  },
  {
    code: 'PROMPT-6',
    title: 'Safe write guidance',
    description: 'A writing agent requires confirm-before-write and explains house conventions.',
    sources: [`${STANDARD}#7-system-prompt-structure--quality`, 'HOUSE'],
    judgment: {
      scope: 'Writing authority, confirm-before-write instruction, and applicable house conventions.',
      prompt:
        'If it may write, requires confirm-before-write and house conventions, stating the why alongside each rule.',
      outcomes: ['conforming', 'write safety revision required', 'convention rationale required'],
      guidance:
        'Require confirmation before writing and state each applicable convention with its rationale; remove write authority if it is not needed.'
    }
  },
  {
    code: 'PROMPT-7',
    title: 'Focused prompt',
    description: 'The system prompt stays focused on one role with consistent, useful terminology.',
    sources: [`${STANDARD}#6-system-prompt-size--focus`, `${STANDARD}#7-system-prompt-structure--quality`, 'BP'],
    judgment: {
      scope: 'The complete system-prompt body, role focus, terminology, and standing-token cost.',
      prompt: 'Focused on one role, consistent terminology, no token spent on what Claude already knows.',
      outcomes: ['conforming', 'focus revision required', 'terminology revision required'],
      guidance:
        'Remove generic knowledge, keep one role and consistent terms, and move rarely needed detail to referenced material.'
    }
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
