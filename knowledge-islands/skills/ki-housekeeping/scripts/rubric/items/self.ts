import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingRubricContext, HousekeepingSelfContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-claude-state.md'

const SELF_1: RubricItem<HousekeepingSelfContext> = {
  code: 'SELF-1',
  title: 'Repository-local ki-self source',
  description:
    'The selected repository owns one regular `ki-self` source at `.agents/skills/ki-self/SKILL.md`. Missing is a WARN; a symlink or non-regular source is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    audit: { phase: 'INSPECT', run: (context) => context.source }
  }
}

const SELF_2: RubricItem<HousekeepingSelfContext> = {
  code: 'SELF-2',
  title: 'ki-self source name',
  description: 'The repository-local source declares `name: ki-self`. A mismatch is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.sourceName }
  }
}

const SELF_3: RubricItem<HousekeepingSelfContext> = {
  code: 'SELF-3',
  title: 'Claude runtime projection',
  description:
    'When `claude-code` is declared, `.claude/skills/ki-self` is a relative link to the canonical source. A missing or divergent projection is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.projection }
  }
}

const SELF_4: RubricItem<HousekeepingSelfContext> = {
  code: 'SELF-4',
  title: 'Local-concerns contract',
  description:
    'The local skill gives its repository an intelligible local-concerns contract: regular work has a repeatable check or procedure; semi-regular human review has a ledger; one-off work remains on the roadmap; cross-repository patterns graduate to a named shared skill.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Does the local skill distinguish repeatable procedures, semi-regular review, one-off roadmap work, and patterns that should graduate to a shared skill?'
  }
}

export const SELF: RubricFamily<HousekeepingRubricContext, HousekeepingSelfContext> = {
  code: 'SELF',
  title: 'Repository-local companion',
  description: 'Repository-local ki-self companion requirements.',
  standard: SOURCE,
  selectContext: (context) => context.self,
  items: [SELF_1, SELF_2, SELF_3, SELF_4]
}
