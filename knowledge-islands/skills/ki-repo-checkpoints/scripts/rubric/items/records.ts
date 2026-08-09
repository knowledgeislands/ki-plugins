import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, RecordContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const RECORD_1: RubricItem<RecordContext> = {
  code: 'RECORD-1',
  title: 'record identity is human-selected and consistent',
  description:
    'Each filename stem is a non-empty single path component that is neither `.` nor `..` and does not encode a mechanically recognisable opaque runtime-session identifier. The filename, `thread` field, and H1 repeat the same human-selected thread name.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    heuristic: true,
    remediation: {
      class: 'guarded',
      guidance: 'Correct record identity only through an explicit user-selected thread update.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.identity }
  },
  judgment: {
    scope: 'Every checkpoint filename, thread field, and H1.',
    prompt: 'Is each thread name a stable human-selected lookup key rather than a vendor or runtime identifier?',
    outcomes: ['conforming', 'explicit rename required', 'escalate to user'],
    guidance: 'Keep the user-selected thread as the lookup key; do not derive or replace it from runtime metadata.'
  }
}

const RECORD_2: RubricItem<RecordContext> = {
  code: 'RECORD-2',
  title: 'frontmatter and headings use the closed schema',
  description:
    'Active records declare exactly type, thread, state, created_at, and updated_at; retired records additionally declare retired_at. Every record uses the exact H1 and ordered Objective, Current state, Decisions made, Files touched, Open questions, and Next step H2 sections, each with substantive content.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance: 'Correct authored record schema only through an explicit checkpoint update.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.schema }
  },
  judgment: {
    scope: 'The authored frontmatter, headings, and reconstruction sections of every record.',
    prompt: 'Can the schema correction be made without inventing or discarding user-owned reconstruction state?',
    outcomes: ['conforming', 'explicit update required', 'escalate to user'],
    guidance: 'Ask the user to update uncertain authored content; the checker must not infer missing checkpoint state.'
  }
}

export const RECORD: RubricFamily<CheckpointsRubricContext, RecordContext> = {
  code: 'RECORD',
  title: 'Checkpoint record',
  description: 'Closed metadata and document shape make one snapshot portable and deterministically readable.',
  standard: SOURCE,
  selectContext: (context) => context.records,
  items: [RECORD_1, RECORD_2]
}
