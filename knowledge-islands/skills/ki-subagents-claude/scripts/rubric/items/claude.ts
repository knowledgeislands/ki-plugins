import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ClaudeContext, ClaudeDefinition } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const fields = new Set([
  'name',
  'description',
  'tools',
  'disallowedTools',
  'model',
  'permissionMode',
  'maxTurns',
  'skills',
  'mcpServers',
  'hooks',
  'memory',
  'background',
  'effort',
  'isolation',
  'color',
  'initialPrompt'
])
const unavailable = (context: ClaudeContext): readonly AuditOutcome[] | null => {
  if (context.unsafePath)
    return [
      {
        status: 'VIOLATION',
        message: 'The Claude source path is unreadable, non-physical, or a symbolic link.',
        subject: context.unsafePath
      }
    ]
  if (context.rootState === 'absent')
    return [
      {
        status: 'NOT_APPLICABLE',
        message:
          'No candidate Claude source payload exists at subagents/. Publication and activation remain unavailable.',
        subject: 'subagents/'
      }
    ]
  if (context.rootState === 'unsafe')
    return [{ status: 'VIOLATION', message: 'subagents/ is not a physical directory.', subject: 'subagents/' }]
  if (!context.definition)
    return [
      { status: 'NOT_APPLICABLE', message: 'No physical Claude source definition is available.', subject: 'subagents/' }
    ]
  return null
}
const source = (definition: ClaudeDefinition): string => definition.file
const CLAUDE_1: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-1',
  title: 'Markdown and parseable YAML',
  description: 'Each candidate is a physical Markdown file with a parseable mapping frontmatter block.',
  sources: [`${STANDARD}#source-format`, 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Repair the Claude source payload through its owner; do not publish it from this audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked) return blocked
        const definition = context.definition as ClaudeDefinition
        return [
          {
            status: definition.raw !== null && definition.parseError === null ? 'PASS' : 'VIOLATION',
            message:
              definition.raw === null
                ? 'No YAML frontmatter block exists at the top of the Markdown source.'
                : definition.parseError
                  ? `YAML frontmatter does not parse: ${definition.parseError}`
                  : 'Markdown and YAML source shape is valid.',
            subject: source(definition)
          }
        ]
      }
    }
  }
}
const CLAUDE_2: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-2',
  title: 'Required Claude fields and name grammar',
  description:
    'Claude source has string name and description fields; its name uses lowercase letters and hyphens only.',
  sources: [`${STANDARD}#required-fields`, 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'diagnostic', guidance: 'Repair required Claude fields through the payload owner.' },
    audit: {
      phase: 'PRIMARY',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked || !context.definition || context.definition.parseError)
          return blocked ?? [{ status: 'NOT_APPLICABLE', message: 'Malformed source cannot provide field evidence.' }]
        const definition = context.definition
        const name = definition.keys.get('name')
        const description = definition.keys.get('description')
        const validName = typeof name === 'string' && /^[a-z]+(?:-[a-z]+)*$/.test(name)
        return [
          {
            status: typeof description === 'string' && description.trim() && validName ? 'PASS' : 'VIOLATION',
            message:
              typeof description !== 'string' || !description.trim()
                ? 'Claude source requires a non-empty string description.'
                : !validName
                  ? 'Claude name must use lowercase letters and hyphens only; digits and colons are invalid.'
                  : 'Required Claude fields and name grammar are valid.',
            subject: source(definition)
          }
        ]
      }
    }
  }
}
const CLAUDE_3: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-3',
  title: 'Supported Claude field set',
  description: 'The source contains only current Claude Code subagent fields.',
  sources: [`${STANDARD}#supported-fields`, 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Remove or route an unsupported Claude field through the source-payload owner.'
    },
    audit: {
      phase: 'PRIMARY',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked || !context.definition || context.definition.parseError)
          return blocked ?? [{ status: 'NOT_APPLICABLE', message: 'Malformed source cannot provide field evidence.' }]
        const unsupported = [...context.definition.keys.keys()].filter((key) => !fields.has(key))
        return [
          {
            status: unsupported.length ? 'VIOLATION' : 'PASS',
            message: unsupported.length
              ? `Unsupported Claude fields: ${unsupported.join(', ')}.`
              : 'All source fields are supported by the current Claude specification.',
            subject: source(context.definition)
          }
        ]
      }
    }
  }
}
const CLAUDE_4: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-4',
  title: 'Native prompt projection present',
  description: 'The Markdown source carries a non-empty body; its semantic quality is owned by the portable parent.',
  sources: [`${STANDARD}#source-format`],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the approved portable core instructions through the source-payload owner.'
    },
    audit: {
      phase: 'PRIMARY',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked || !context.definition) return blocked ?? []
        return [
          {
            status: context.definition.body.trim() ? 'PASS' : 'VIOLATION',
            message: context.definition.body.trim()
              ? 'The Markdown source includes a native projection of the instructions.'
              : 'The Markdown source has no instruction body.',
            subject: source(context.definition)
          }
        ]
      }
    }
  }
}
const CLAUDE_5: RubricItem<ClaudeContext> = {
  code: 'CLAUDE-5',
  title: 'Unique source names',
  description: 'Physical Claude source files do not duplicate a declared name.',
  sources: [`${STANDARD}#source-discovery`],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Resolve the duplicate with the source-payload owner; a filename is not authority to rename an agent.'
    },
    audit: {
      phase: 'DERIVED',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked || !context.definition || context.definition.parseError) return blocked ?? []
        const name = context.definition.keys.get('name')
        const duplicates =
          typeof name === 'string'
            ? context.definitions.filter((candidate) => candidate.keys.get('name') === name).length
            : 0
        return [
          {
            status: duplicates > 1 ? 'VIOLATION' : 'PASS',
            message: duplicates > 1 ? `Claude source name "${name}" is duplicated.` : 'Claude source name is unique.',
            subject: source(context.definition)
          }
        ]
      }
    }
  }
}
export const CLAUDE: RubricFamily<ClaudeContext, ClaudeContext> = {
  code: 'CLAUDE',
  title: 'Claude source projection',
  description: 'Native Markdown/YAML source shape only; no host publication or activation assurance.',
  standard: STANDARD,
  selectContext: (context) => context,
  items: [CLAUDE_1, CLAUDE_2, CLAUDE_3, CLAUDE_4, CLAUDE_5]
}
