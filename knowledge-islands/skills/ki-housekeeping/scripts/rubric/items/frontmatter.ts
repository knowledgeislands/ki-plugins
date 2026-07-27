import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingFrontmatterContext, HousekeepingRubricContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const FM_1: RubricItem<HousekeepingFrontmatterContext> = {
  code: 'FM-1',
  title: 'Frontmatter is present',
  description: 'A `---`-delimited frontmatter block is present at the top of every `memory/*.md` file. Missing is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.present }
  }
}

const FM_2: RubricItem<HousekeepingFrontmatterContext> = {
  code: 'FM-2',
  title: 'Frontmatter name matches filename',
  description: 'The `name` field is present and matches the kebab-case filename without its `.md` suffix. Mismatch is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.namesMatch },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.alignNames?.()
      }
    }
  }
}

const FM_3: RubricItem<HousekeepingFrontmatterContext> = {
  code: 'FM-3',
  title: 'Frontmatter description is present',
  description: 'The `description` field is present and non-empty. Missing is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.descriptions }
  }
}

const FM_4: RubricItem<HousekeepingFrontmatterContext> = {
  code: 'FM-4',
  title: 'Frontmatter type is valid',
  description:
    '`metadata.type` is present and is exactly one of `user`, `feedback`, `project`, or `reference`. Missing or invalid is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.types }
  }
}

const FM_5: RubricItem<HousekeepingFrontmatterContext> = {
  code: 'FM-5',
  title: 'Frontmatter names are unique',
  description: 'No two files share the same `name:` slug. A duplicate is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.uniqueNames }
  }
}

export const FRONTMATTER: RubricFamily<HousekeepingRubricContext, HousekeepingFrontmatterContext> = {
  code: 'FM',
  title: 'Frontmatter',
  description: 'Memory frontmatter requirements.',
  standard: SOURCE,
  selectContext: (context) => context.frontmatter,
  items: [FM_1, FM_2, FM_3, FM_4, FM_5]
}
