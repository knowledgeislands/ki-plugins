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
  title: 'legacy note classification',
  description: 'A declared legacy note_type_scheme remains valid only while a base migrates old Streams records.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Use the documented `type` or `tags` scheme, or record the governing decision for a different note classification.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.noteTypeScheme, 'WARN') }
  }
}

export const CONFIG: RubricFamily<StreamsRubricContext, ConfigRubricContext> = {
  code: 'CONFIG',
  title: 'Streams configuration',
  description: 'The skill-owned ki-repo-kb-streams table.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CONFIG_1, CONFIG_2]
}
