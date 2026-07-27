import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#root-orientation'] as const

const CLAUDE_1: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-1',
  title: 'Harness introduction',
  description: 'The root orientation opens by explaining the source harness and naming all five parts.',
  sources: STANDARD,
  judgment: {
    prompt: 'Does the effective root orientation explain the source harness and name all five parts?'
  }
}

const CLAUDE_2: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-2',
  title: 'Five-part status',
  description: 'The root orientation gives a current status for every source-harness part.',
  sources: STANDARD,
  judgment: { prompt: 'Does the orientation status table or equivalent agree with the five actual source shelves?' }
}

const CLAUDE_3: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-3',
  title: 'Working conventions',
  description: 'The root orientation routes working conventions for every source-harness part.',
  sources: STANDARD,
  judgment: { prompt: 'Does each source-harness part have concise working guidance or a route to its governing skill?' }
}

const CLAUDE_4: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-4',
  title: 'Native toolchain commands',
  description: 'The root orientation lists the direct ki commands and repository gates contributors need.',
  sources: STANDARD,
  judgment: {
    prompt: 'Are direct ki audit, conform, rubric-publication, test, and TypeScript gates documented without retired package aliases?'
  }
}

const CLAUDE_5: RubricItem<HarnessReviewContext> = {
  code: 'CLAUDE-5',
  title: 'Orientation freshness',
  description: 'Counts, shelf statuses, capability boundaries, and command names in the orientation match the repository.',
  sources: STANDARD,
  judgment: {
    prompt: 'Do orientation claims agree with the current source shelves, compatible payload, and direct host commands?'
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
