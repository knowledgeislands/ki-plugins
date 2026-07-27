import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type StreamRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-streams-structure.md'

const STREAM_1: RubricItem<StreamRubricContext> = {
  code: 'STREAM-1',
  title: 'Focus folders',
  description: 'Folders directly under Streams are canonical Focus folders.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.focusFolders, 'WARN', ['FAIL']) }
  }
}

const STREAM_2: RubricItem<StreamRubricContext> = {
  code: 'STREAM-2',
  title: 'Focus indexes',
  description: 'Each present Focus carries a same-name index note.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.focusIndexes, 'WARN') }
  }
}

const STREAM_3: RubricItem<StreamRubricContext> = {
  code: 'STREAM-3',
  title: 'proposal suffix',
  description: 'Full proposal filenames, H1 headings, and titles use the Proposal suffix while lightweight streams do not.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.proposalSuffix, 'WARN') }
  }
}

const STREAM_4: RubricItem<StreamRubricContext> = {
  code: 'STREAM-4',
  title: 'Focus index ordering',
  description: 'Focus indexes carry correctly ordered Streams tables and one category convention.',
  sources: [SOURCE],
  judgment: { prompt: 'Are index tables current, ordered, and consistently categorised?' }
}

const STREAM_5: RubricItem<StreamRubricContext> = {
  code: 'STREAM-5',
  title: 'Focus placement',
  description: 'Each stream sits under its real attention Focus.',
  sources: [SOURCE],
  judgment: { prompt: 'Do sampled streams match their actual attention Focus?' }
}

export const STREAM: RubricFamily<StreamsRubricContext, StreamRubricContext> = {
  code: 'STREAM',
  title: 'Streams structure',
  description: 'Focus layout, indexes, proposal suffixes, and placement.',
  standard: SOURCE,
  selectContext: (context) => context.stream,
  items: [STREAM_1, STREAM_2, STREAM_3, STREAM_4, STREAM_5]
}
