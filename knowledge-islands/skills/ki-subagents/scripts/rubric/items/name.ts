import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const NAME_MAX = 64
const RESERVED_NAMES = ['anthropic', 'claude'] as const

const inspect = (
  context: AgentFileContext,
  run: (agent: NonNullable<AgentFileContext['agent']>) => readonly AuditOutcome[]
): readonly AuditOutcome[] =>
  context.agent ? run(context.agent) : [{ status: 'NOT_APPLICABLE', message: 'No physical agent definition is available.' }]

const NAME_1: RubricItem<AgentFileContext> = {
  code: 'NAME-1',
  title: 'Name present',
  description: 'name is present.',
  sources: [`${STANDARD}#3-frontmatter-name`, 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => [
          agent.frontmatter.raw === null
            ? { status: 'NOT_APPLICABLE', message: 'Frontmatter is absent.', subject: agent.file }
            : {
                status: agent.name ? 'PASS' : 'VIOLATION',
                message: agent.name ? 'name is present.' : 'name is missing from frontmatter.',
                subject: agent.file
              }
        ])
    }
  }
}

const NAME_2: RubricItem<AgentFileContext> = {
  code: 'NAME-2',
  title: 'Name characters and length',
  description: 'name uses lowercase letters, digits, and hyphens only and is at most 64 characters.',
  sources: [`${STANDARD}#3-frontmatter-name`, 'CC', 'BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => {
          if (!agent.name) return [{ status: 'NOT_APPLICABLE', message: 'name is absent.', subject: agent.file }]
          const violations: AuditOutcome[] = []
          if (agent.name.length > NAME_MAX)
            violations.push({ status: 'VIOLATION', message: `name is ${agent.name.length} chars (max ${NAME_MAX}).`, subject: agent.file })
          if (!/^[a-z0-9-]+$/.test(agent.name))
            violations.push({
              status: 'VIOLATION',
              message: `name "${agent.name}" must use lowercase letters, digits, and hyphens only.`,
              subject: agent.file
            })
          return violations.length
            ? violations
            : [{ status: 'PASS', message: 'name characters and length are valid.', subject: agent.file }]
        })
    }
  }
}

const NAME_3: RubricItem<AgentFileContext> = {
  code: 'NAME-3',
  title: 'Name hyphen placement',
  description: 'name has no leading or trailing hyphen and no consecutive hyphens.',
  sources: [`${STANDARD}#3-frontmatter-name`, 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => [
          !agent.name
            ? { status: 'NOT_APPLICABLE', message: 'name is absent.', subject: agent.file }
            : {
                status: agent.name.startsWith('-') || agent.name.endsWith('-') || agent.name.includes('--') ? 'VIOLATION' : 'PASS',
                message: 'name must not start or end with a hyphen or contain consecutive hyphens.',
                subject: agent.file
              }
        ])
    }
  }
}

const NAME_4: RubricItem<AgentFileContext> = {
  code: 'NAME-4',
  title: 'Name safety',
  description: 'name contains no XML tags and no reserved words (anthropic, claude).',
  sources: [`${STANDARD}#3-frontmatter-name`, 'BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => {
          if (!agent.name) return [{ status: 'NOT_APPLICABLE', message: 'name is absent.', subject: agent.file }]
          const violations: AuditOutcome[] = []
          if (/<\/?[a-zA-Z][^>]*>/.test(agent.name))
            violations.push({ status: 'VIOLATION', message: 'name contains an XML tag.', subject: agent.file })
          for (const reserved of RESERVED_NAMES)
            if (agent.name.includes(reserved))
              violations.push({ status: 'VIOLATION', message: `name contains the reserved word "${reserved}".`, subject: agent.file })
          return violations.length
            ? violations
            : [{ status: 'PASS', message: 'name contains no XML tags or reserved words.', subject: agent.file }]
        })
    }
  }
}

const NAME_5: RubricItem<AgentFileContext> = {
  code: 'NAME-5',
  title: 'Unique name',
  description: 'name is unique across the agent set.',
  sources: [`${STANDARD}#3-frontmatter-name`, 'CC', 'HOUSE'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        inspect(context, (agent) => {
          if (!agent.name) return [{ status: 'NOT_APPLICABLE', message: 'name is absent.', subject: agent.file }]
          return [
            context.duplicateNameFiles.length > 1
              ? {
                  status: 'VIOLATION',
                  message: `name "${agent.name}" is also used by ${context.duplicateNameFiles
                    .filter((file) => file !== agent.file)
                    .map((file) => file.split('/').at(-1))
                    .sort()
                    .join(', ')}.`,
                  subject: agent.file
                }
              : { status: 'PASS', message: 'Agent name is unique across the set.', subject: agent.file }
          ]
        })
    }
  }
}

const NAME_6: RubricItem<AgentFileContext> = {
  code: 'NAME-6',
  title: 'Specific role name',
  description: 'name is a specific role, not a generic helper or assistant.',
  sources: [`${STANDARD}#3-frontmatter-name`, 'BP'],
  judgment: { prompt: 'name is a specific role, not generic (engineering-lead, not helper/assistant).' }
}

export const NAME: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'NAME',
  title: 'Frontmatter name',
  description: 'Agent name syntax, uniqueness, and role quality.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [NAME_1, NAME_2, NAME_3, NAME_4, NAME_5, NAME_6]
}
