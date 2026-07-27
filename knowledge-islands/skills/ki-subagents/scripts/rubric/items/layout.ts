import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'

const unavailable = (context: AgentFileContext): readonly AuditOutcome[] | null => {
  if (context.unsafePath)
    return [
      { status: 'VIOLATION', message: 'The agent path is unreadable, non-physical, or a symbolic link.', subject: context.unsafePath }
    ]
  if (context.scopeState === 'absent')
    return [{ status: 'VIOLATION', message: 'The subagents/ scope does not exist.', subject: 'subagents/' }]
  if (context.scopeState === 'unsafe')
    return [{ status: 'VIOLATION', message: 'The subagents/ scope is not a physical directory.', subject: 'subagents/' }]
  if (!context.agent) return [{ status: 'NOT_APPLICABLE', message: 'No agent definitions were found.', subject: 'subagents/' }]
  return null
}

const LAY_1: RubricItem<AgentFileContext> = {
  code: 'LAY-1',
  title: 'Agent file and frontmatter layout',
  description: 'The agent is a single .md file with a YAML frontmatter block at the top.',
  sources: [`${STANDARD}#2-layout`, 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked) return blocked
        const agent = context.agent
        if (!agent) return []
        return [
          {
            status: agent.frontmatter.raw === null ? 'VIOLATION' : 'PASS',
            message:
              agent.frontmatter.raw === null
                ? 'No YAML frontmatter block (--- ... ---) exists at the top of the file.'
                : 'Agent is a Markdown file with top-level YAML frontmatter.',
            subject: agent.file
          }
        ]
      }
    }
  }
}

const LAY_2: RubricItem<AgentFileContext> = {
  code: 'LAY-2',
  title: 'Path-independent identity',
  description: 'Grouping subdirectories are for human organisation only; identity is name, not path.',
  sources: [`${STANDARD}#2-layout`, 'CC', 'HOUSE'],
  judgment: { prompt: 'Grouping subdirectories are for human organisation only; identity is name, not path.' }
}

const LAY_3: RubricItem<AgentFileContext> = {
  code: 'LAY-3',
  title: 'Filename and name alignment',
  description: 'The filename stem matches name.',
  sources: [`${STANDARD}#2-layout`, 'HOUSE'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.agent)
          return [{ status: 'NOT_APPLICABLE', message: 'No physical agent definition is available for filename alignment.' }]
        const agent = context.agent
        if (!agent.name)
          return [{ status: 'NOT_APPLICABLE', message: 'No name field is available for filename alignment.', subject: agent.file }]
        return [
          {
            status: agent.name === agent.stem ? 'PASS' : 'VIOLATION',
            message:
              agent.name === agent.stem
                ? 'Filename stem matches name.'
                : `name "${agent.name}" does not match the filename stem "${agent.stem}" — align the frontmatter name.`,
            subject: agent.file
          }
        ]
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.requestNameAlignment?.()
      }
    }
  }
}

export const LAY: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'LAY',
  title: 'File and frontmatter layout',
  description: 'Agent definition layout and filename identity.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [LAY_1, LAY_2, LAY_3]
}
