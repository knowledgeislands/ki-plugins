import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbLinkContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const LINK_1: RubricItem<KbLinkContext> = {
  code: 'LINK-1',
  title: 'Obsidian note linking',
  description: 'Base note content uses shortest-unique Obsidian wikilinks, with aliased full paths for contents lists.',
  sources: [SOURCE],
  judgment: {
    scope: 'Sampled base notes and the prescribed linking convention.',
    prompt: 'Do sampled base notes use the prescribed Obsidian wikilink convention?',
    outcomes: ['conforming', 'note revision', 'convention clarification'],
    guidance: 'Revise links to the established convention; do not change the convention from a sample alone.'
  }
}

export const LINK: RubricFamily<KbRubricContext, KbLinkContext> = {
  code: 'LINK',
  title: 'base linking',
  description: 'Judgment review of Obsidian wikilink content.',
  standard: SOURCE,
  selectContext: (context) => context.links,
  items: [LINK_1]
}
