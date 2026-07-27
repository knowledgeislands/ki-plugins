import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingIndexContext, HousekeepingRubricContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const IDX_1: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-1',
  title: 'Memory index exists',
  description:
    '`MEMORY.md` exists in each discovered physical memory directory. Missing is a FAIL because a non-empty memory directory without an index is unusable.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.exists }
  }
}

const IDX_2: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-2',
  title: 'Index entries resolve',
  description:
    'Every `MEMORY.md` entry in the `- [Title](file.md) — hook` shape resolves to a physical file in the same memory directory. A dangling entry is a FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.entriesResolve }
  }
}

const IDX_3: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-3',
  title: 'Memory files are indexed',
  description:
    'Every `memory/*.md` file other than `MEMORY.md` appears in the index. An unindexed file is a WARN because it is invisible to future recall.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.filesIndexed },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.appendUnindexed?.()
      }
    }
  }
}

const IDX_4: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-4',
  title: 'Index line length',
  description: 'Each index entry stays at or under 150 characters so it is not truncated in context.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: { phase: 'INSPECT', run: (context) => context.lineLength }
  }
}

const IDX_5: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-5',
  title: 'Headroom block markers',
  description:
    'A Headroom auto-generated block, if present, has both `<!-- headroom:learn:start -->` and `<!-- headroom:learn:end -->` markers in order. A malformed pair is a WARN.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.markers }
  }
}

const IDX_6: RubricItem<HousekeepingIndexContext> = {
  code: 'IDX-6',
  title: 'Headroom learned entries are local',
  description:
    'Entries inside a `headroom:learn` block are not rooted in another repository. A foreign absolute `knowledgeislands/<repo>` path in the selected repository memory is stale cross-repo capture and a WARN. Repair the Headroom database source through the explicit list/show/delete procedure in the standard before clearing rendered output; relative sibling references remain valid.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: { phase: 'INSPECT', run: (context) => context.learnedEntries }
  }
}

export const INDEX: RubricFamily<HousekeepingRubricContext, HousekeepingIndexContext> = {
  code: 'IDX',
  title: 'Index/file agreement',
  description: 'Memory index and file agreement.',
  standard: SOURCE,
  selectContext: (context) => context.index,
  items: [IDX_1, IDX_2, IDX_3, IDX_4, IDX_5, IDX_6]
}
