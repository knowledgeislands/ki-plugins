import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'

const STANDARD = 'standards-subagent-definitions.md'
const REVIEW = {
  scope: 'The target agent role, lane boundary, sibling hand-offs, and grounding sources.',
  outcomes: ['conforming', 'gap', 'exclusion'] as const,
  guidance: 'Revise the role boundary through its responsible author, record a gap, or record an explicit exclusion.'
}

const LANE_ITEMS = [
  {
    code: 'LANE-1',
    title: 'Distinct lane',
    description: 'The agent owns a distinct lane whose boundary prevents sibling overlap.',
    sources: [`${STANDARD}#9-lane--delegation`, 'HOUSE'],
    judgment: { ...REVIEW, prompt: 'The agent owns a distinct lane; its boundary keeps it from overlapping siblings.' }
  },
  {
    code: 'LANE-2',
    title: 'Reciprocal hand-offs',
    description: 'Adjacent sibling agents name each other as hand-offs.',
    sources: [`${STANDARD}#9-lane--delegation`, 'HOUSE'],
    judgment: {
      ...REVIEW,
      prompt:
        'Where a sibling is genuinely adjacent, each names the other as the hand-off — reciprocal, not one-directional.'
    }
  },
  {
    code: 'LANE-3',
    title: 'Bounded coordinator tools',
    description: 'A coordinator restricts the agent types it may spawn and declares what it orchestrates.',
    sources: [`${STANDARD}#9-lane--delegation`, 'CC'],
    judgment: {
      ...REVIEW,
      prompt:
        'A coordinator agent — one that spawns subagents — restricts which agents it may spawn via `Agent(type)` in `tools` (e.g. `tools: Agent(worker, researcher)`). Its own-vs-defer boundary declares which agents it orchestrates and why; an unrestricted coordinator is a blast-radius risk.'
    }
  },
  {
    code: 'LANE-4',
    title: 'Bounded nesting depth',
    description: 'Subagent nesting is at most five levels and coordinators declare their spawn depth.',
    sources: [`${STANDARD}#9-lane--delegation`, 'CC'],
    judgment: {
      ...REVIEW,
      prompt:
        'Subagents may nest to a depth of at most five. A coordinator’s system prompt declares its spawn depth so callers can reason about total depth. Avoid nesting unless hierarchical decomposition genuinely helps; flat fan-out is simpler and easier to audit.'
    }
  },
  {
    code: 'LANE-5',
    title: 'Coordinator progress visibility',
    description: 'A coordinator owns caller-visible progress for long-running and background work.',
    sources: [`${STANDARD}#9-lane--delegation`, 'HOUSE'],
    judgment: {
      ...REVIEW,
      prompt:
        'A coordinator’s system prompt owns progress visibility for long-running/background work: it announces the next checkpoint, reports phase completion and material blockers, and uses the caller’s cadence or five-minute default. Workers report to the coordinator; the coordinator updates the caller.'
    }
  }
] as const

export const LANE: RubricFamily<AgentsRubricContext, AgentFileContext> = {
  code: 'LANE',
  title: 'Lane and delegation',
  description: 'Agent ownership, boundaries, and orchestration.',
  standard: STANDARD,
  selectContext: (context) => context.file,
  items: [...LANE_ITEMS] as readonly RubricItem<AgentFileContext>[]
}
