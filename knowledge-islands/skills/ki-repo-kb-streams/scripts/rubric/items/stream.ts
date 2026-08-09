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
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reshape the Streams tree only after confirming the intended Focus ownership and canonical location for each entry.'
    },
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
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or repair the matching Focus index after confirming the Focus and stream ownership relationship.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.focusIndexes, 'WARN') }
  }
}

const STREAM_3: RubricItem<StreamRubricContext> = {
  code: 'STREAM-3',
  title: 'proposal suffix',
  description:
    'Full proposal filenames, H1 headings, and titles use the Proposal suffix while lightweight streams do not.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the filename, H1, and title suffix only after confirming whether the note is a full proposal or lightweight stream.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.proposalSuffix, 'WARN') }
  }
}

const STREAM_4: RubricItem<StreamRubricContext> = {
  code: 'STREAM-4',
  title: 'Focus index ordering',
  description: 'Focus indexes carry correctly ordered Streams tables and one category convention.',
  sources: [SOURCE],
  judgment: {
    scope: 'Focus index tables, their current streams, ordering, and category convention.',
    prompt: 'Are index tables current, ordered, and consistently categorised?',
    outcomes: ['conforming', 'index revision required', 'category decision required'],
    guidance:
      'Update rows and ordering from the current streams, and apply one documented category convention or record a deliberate exception.'
  }
}

const STREAM_5: RubricItem<StreamRubricContext> = {
  code: 'STREAM-5',
  title: 'Focus placement',
  description: 'Each stream sits under its real attention Focus.',
  sources: [SOURCE],
  judgment: {
    scope: 'Sampled streams, their stated purpose, and parent Focus placement.',
    prompt: 'Do sampled streams match their actual attention Focus?',
    outcomes: ['conforming', 'relocation required', 'focus decision required'],
    guidance:
      'Move the stream to the Focus that owns its present attention, or record the deliberate cross-Focus rationale.'
  }
}

export const STREAM: RubricFamily<StreamsRubricContext, StreamRubricContext> = {
  code: 'STREAM',
  title: 'Streams structure',
  description: 'Focus layout, indexes, proposal suffixes, and placement.',
  standard: SOURCE,
  selectContext: (context) => context.stream,
  items: [STREAM_1, STREAM_2, STREAM_3, STREAM_4, STREAM_5]
}
