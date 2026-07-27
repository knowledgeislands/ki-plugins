import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const mechanical = (code: string, title: string, description: string, passMessage: string): RubricItem<RoadmapAuditContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, code, passMessage) }
  }
})

const THEME_1 = mechanical(
  'THEME-1',
  'theme layout',
  'Theme directories are lowercase kebab-case, contain `ROADMAP.md`, and thematic items are `###` headings under a horizon.',
  'Every theme has canonical layout.'
)

const THEME_2 = mechanical(
  'THEME-2',
  'stable theme code',
  'Every theme roadmap declares exactly one unquoted uppercase `code`, unique across the repository; plan IDs in that theme begin with that stable code.',
  'Every theme has one stable unique code.'
)

const THEME_3 = mechanical(
  'THEME-3',
  'non-empty themes',
  'A theme roadmap contains at least one item; an empty theme must be pruned deliberately after confirming it holds no authored content or plans.',
  'Every theme contains at least one roadmap item.'
)

const THEME_4: RubricItem<RoadmapAuditContext> = {
  code: 'THEME-4',
  title: 'coherent themes',
  description: 'Themes are coherent workstreams, neither catch-alls nor one-item bureaucracy.',
  sources: [SOURCE],
  judgment: { prompt: 'Review theme boundaries and granularity.' }
}

export const THEME: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'THEME',
  title: 'themes',
  description: 'Thematic roadmap identity, layout, and coherence.',
  standard: SOURCE,
  selectContext: (context) => context.themes,
  items: [THEME_1, THEME_2, THEME_3, THEME_4]
}
