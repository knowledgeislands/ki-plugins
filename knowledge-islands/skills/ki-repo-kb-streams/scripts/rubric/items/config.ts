import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type ConfigRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-streams-structure.md'

const CONFIG_1: RubricItem<ConfigRubricContext> = {
  code: 'CONFIG-1',
  title: 'known Streams configuration',
  description: 'Only documented Streams container bindings are recognised under ki-repo-kb-streams.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Remove or document unsupported configuration keys after confirming the Streams behaviour they were intended to express.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knownKeys, 'WARN') }
  }
}

const CONFIG_2: RubricItem<ConfigRubricContext> = {
  code: 'CONFIG-2',
  title: 'contained process note binding',
  description:
    'When process_note is declared, it resolves to a regular file beneath the base without symlink traversal.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct or remove the process_note binding; do not follow a link or substitute a local authority note.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.processNote, 'WARN') }
  }
}

const CONFIG_0: RubricItem<ConfigRubricContext> = {
  code: 'CONFIG-0',
  title: 'parseable Streams configuration',
  description: 'The shared configuration file parses before Streams bindings are used.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the TOML syntax before relying on Streams configuration.'
    },
    audit: { phase: 'PREPARE', run: (context) => auditEvidence(context.parseable, 'FAIL') }
  }
}

export const CONFIG: RubricFamily<StreamsRubricContext, ConfigRubricContext> = {
  code: 'CONFIG',
  title: 'Streams configuration',
  description: 'The skill-owned ki-repo-kb-streams table.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CONFIG_0, CONFIG_1, CONFIG_2]
}
