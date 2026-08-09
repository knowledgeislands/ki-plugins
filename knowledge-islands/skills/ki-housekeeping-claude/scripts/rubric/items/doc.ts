import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingDocContext, HousekeepingRubricContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const DOC_1: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-1',
  title: 'Content doctrine',
  description:
    '`feedback` and `project` memories carry the rule/fact, then a **Why:** line and a **How to apply:** line — not just a bare assertion.',
  sources: [SOURCE],
  judgment: judgment('Do feedback and project memories carry their rule or fact, Why, and How to apply?')
}

const DOC_2: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-2',
  title: 'Content doctrine',
  description: '`project` memories use absolute dates, not relative ones ("2026-03-05", not "Thursday").',
  sources: [SOURCE],
  judgment: judgment('Do project memories use absolute rather than relative dates?')
}

const DOC_3: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-3',
  title: 'Content doctrine',
  description:
    'No memory duplicates content that belongs in a `CLAUDE.md` (codebase conventions, file layout, architecture, anything derivable from the repo or git history). Flag promotion candidates instead of leaving them to drift from the code.',
  sources: [SOURCE],
  judgment: judgment(
    'Do memories avoid duplicating content that belongs in CLAUDE.md or is derivable from current repository evidence?'
  )
}

const DOC_4: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-4',
  title: 'Content doctrine',
  description:
    '`user`-type memories describe role/preferences/knowledge neutrally — no content that reads as a negative judgment of the user.',
  sources: [SOURCE],
  judgment: judgment('Do user memories describe role, preferences, and knowledge neutrally?')
}

const DOC_5: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-5',
  title: 'Content doctrine',
  description:
    'No memory is stale — a `project` memory whose fact or decision has visibly been superseded by current repo state (check against `git log`/current files, not the memory’s own text).',
  sources: [SOURCE],
  judgment: judgment('Do project memories remain current against repository state and history?')
}

const DOC_6: RubricItem<HousekeepingDocContext> = {
  code: 'DOC-6',
  title: 'Semantic index ordering',
  description: '`MEMORY.md` entries are organized semantically by topic, not chronologically.',
  sources: [SOURCE],
  judgment: judgment('Are MEMORY.md entries organised semantically rather than chronologically?')
}

export const DOC: RubricFamily<HousekeepingRubricContext, HousekeepingDocContext> = {
  code: 'DOC',
  title: 'Content doctrine',
  description: 'Judgment-applied memory content doctrine.',
  standard: SOURCE,
  selectContext: (context) => context.doc,
  items: [DOC_1, DOC_2, DOC_3, DOC_4, DOC_5, DOC_6]
}
