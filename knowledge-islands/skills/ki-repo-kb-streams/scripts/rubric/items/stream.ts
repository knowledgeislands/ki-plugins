import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type StreamRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-streams-structure.md'

const STREAM_1: RubricItem<StreamRubricContext> = {
  code: 'STREAM-1',
  title: 'operational areas',
  description:
    'Streams contains the Roadmap and Housekeeping operational areas, with Trades reserved for later explicit adoption.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    remediation: {
      class: 'diagnostic',
      guidance:
        'Establish Roadmap and Housekeeping, then classify any legacy or unexpected folders with the receiving base owner.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.operationalAreas, 'WARN', ['FAIL']) }
  }
}

const STREAM_2: RubricItem<StreamRubricContext> = {
  code: 'STREAM-2',
  title: 'legacy state folders',
  description: 'Legacy state and Focus folders are migration inputs, not target Streams structure.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Classify each retained legacy record before removing or replacing a legacy navigation folder.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.legacyFolders, 'WARN') }
  }
}

const STREAM_4: RubricItem<StreamRubricContext> = {
  code: 'STREAM-4',
  title: 'adapter-owned records',
  description:
    'Roadmap and housekeeping records follow their owning adapters rather than a generic Streams proposal model.',
  sources: [SOURCE],
  judgment: {
    scope: 'Roadmap and housekeeping records sampled from the two Streams areas.',
    prompt: 'Does each sampled record follow its owning roadmap or housekeeping adapter?',
    outcomes: ['conforming', 'adapter migration required', 'classification decision required'],
    guidance:
      'Route the record to the correct area and apply its owning adapter’s format; record any unresolved classification decision.'
  }
}

const STREAM_5: RubricItem<StreamRubricContext> = {
  code: 'STREAM-5',
  title: 'legacy migration disposition',
  description:
    'Each retained legacy Stream has a deliberate roadmap, housekeeping, canonical-knowledge, or prune disposition.',
  sources: [SOURCE],
  judgment: {
    scope: 'Sampled legacy Streams records and their owner-approved migration decisions.',
    prompt: 'Does each sampled legacy record have an appropriate explicit disposition?',
    outcomes: ['conforming', 'migration required', 'owner decision required'],
    guidance:
      'Record the owner-approved destination before moving, retaining, or pruning the legacy record; never infer it from the former path.'
  }
}

export const STREAM: RubricFamily<StreamsRubricContext, StreamRubricContext> = {
  code: 'STREAM',
  title: 'Streams structure',
  description: 'Operational-area layout, legacy migration, and adapter routing.',
  standard: SOURCE,
  selectContext: (context) => context.stream,
  items: [STREAM_1, STREAM_2, STREAM_4, STREAM_5]
}
