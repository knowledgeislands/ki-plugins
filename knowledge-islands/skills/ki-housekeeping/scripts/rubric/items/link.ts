import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingLinkContext, HousekeepingRubricContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const LINK_1: RubricItem<HousekeepingLinkContext> = {
  code: 'LINK-1',
  title: 'Unresolved wikilinks are informational',
  description:
    '`[[wikilink]]` cross-references that do not resolve to another file’s `name:` slug are counted and reported as INFO only because the memory doctrine permits intentional forward references.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: { phase: 'INSPECT', run: (context) => context.unresolved }
  }
}

export const LINK: RubricFamily<HousekeepingRubricContext, HousekeepingLinkContext> = {
  code: 'LINK',
  title: 'Explicitly not checked',
  description: 'Informational link treatment.',
  standard: SOURCE,
  selectContext: (context) => context.link,
  items: [LINK_1]
}
