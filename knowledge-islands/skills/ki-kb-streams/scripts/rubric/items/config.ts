import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type ConfigRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-enactment-process.md'

const CONFIG_1: RubricItem<ConfigRubricContext> = {
  code: 'CONFIG-1',
  title: 'known Streams configuration',
  description: 'Only process_note and note_type_scheme are recognised under ki-kb-streams.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knownKeys, 'WARN') }
  }
}

const CONFIG_2: RubricItem<ConfigRubricContext> = {
  code: 'CONFIG-2',
  title: 'note type scheme',
  description: 'note_type_scheme is type or tags when declared.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.noteTypeScheme, 'WARN') }
  }
}

export const CONFIG: RubricFamily<StreamsRubricContext, ConfigRubricContext> = {
  code: 'CONFIG',
  title: 'Streams configuration',
  description: 'The skill-owned ki-kb-streams table.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CONFIG_1, CONFIG_2]
}
