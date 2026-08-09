import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#root-orientation'] as const

const CLAUDE_1: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-1',
  title: 'Harness introduction',
  description: 'The root orientation opens by explaining the source harness and naming all five parts.',
  sources: STANDARD,
  judgment: {
    scope: 'The effective root orientation and all five source-harness shelves.',
    prompt: 'Does the effective root orientation explain the source harness and name all five parts?',
    outcomes: ['conforming', 'orientation revision', 'not applicable'],
    guidance:
      'Revise the orientation with owner-approved current source facts; do not infer shelf status from an unverified payload.'
  }
}

const CLAUDE_2: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-2',
  title: 'Five-part status',
  description: 'The root orientation gives a current status for every source-harness part.',
  sources: STANDARD,
  judgment: {
    scope: 'The orientation status table or equivalent and the five physical source shelves.',
    prompt: 'Does the orientation status table or equivalent agree with the five actual source shelves?',
    outcomes: ['conforming', 'orientation revision', 'source evidence required'],
    guidance:
      'Update the orientation only from current source evidence and preserve the distinction between source shelves and installed payload.'
  }
}

const CLAUDE_3: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-3',
  title: 'Working conventions',
  description: 'The root orientation routes working conventions for every source-harness part.',
  sources: STANDARD,
  judgment: {
    scope: 'The root orientation and the working guidance or owning-skill route for every source-harness part.',
    prompt: 'Does each source-harness part have concise working guidance or a route to its governing skill?',
    outcomes: ['conforming', 'orientation revision', 'route to owner'],
    guidance:
      'Add concise routing guidance without duplicating the owning standard or claiming another skill’s authority.'
  }
}

const CLAUDE_4: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-4',
  title: 'Native toolchain commands',
  description: 'The root orientation lists the direct ki commands and repository gates contributors need.',
  sources: STANDARD,
  judgment: {
    scope:
      'The root orientation, documented commands, and the repository’s current direct host and verification interfaces.',
    prompt:
      'Are direct ki audit, conform, rubric-publication, test, and TypeScript gates documented without retired package aliases?',
    outcomes: ['conforming', 'orientation revision', 'tooling clarification required'],
    guidance:
      'Document only verified current commands; route a toolchain or host change to its owning capability rather than inventing an alias.'
  }
}

const CLAUDE_5: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-5',
  title: 'Orientation freshness',
  description:
    'Counts, shelf statuses, capability boundaries, and command names in the orientation match the repository.',
  sources: STANDARD,
  judgment: {
    scope:
      'All factual orientation claims, current source shelves, compatible payload evidence, and direct host commands.',
    prompt:
      'Do orientation claims agree with the current source shelves, compatible payload, and direct host commands?',
    outcomes: ['conforming', 'orientation revision', 'evidence required'],
    guidance:
      'Correct only evidence-backed claims and leave unresolved host or payload facts for their owning authority.'
  }
}

export const CLAUDE: RubricFamily<HarnessRubricContext, HarnessReviewContext> = {
  code: 'CLAUDE',
  title: 'Root orientation',
  description: 'Coverage and freshness of the effective source-harness orientation.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.review,
  items: [CLAUDE_1, CLAUDE_2, CLAUDE_3, CLAUDE_4, CLAUDE_5]
}
