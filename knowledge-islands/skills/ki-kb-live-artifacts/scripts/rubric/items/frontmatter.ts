import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { LiveArtifactsFrontmatterContext, LiveArtifactsRubricContext } from '../contexts/live-artifacts.ts'

const SOURCE = 'standards-live-artifacts.md'

const LA_F_1: RubricItem<LiveArtifactsFrontmatterContext> = {
  code: 'LA-F-1',
  title: 'artifact status',
  description: 'Each artifact source declares status: active or status: archived.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.status }
  }
}

const LA_F_2: RubricItem<LiveArtifactsFrontmatterContext> = {
  code: 'LA-F-2',
  title: 'render declaration',
  description: 'Each frontmatter block includes html in its renders declaration.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.renders },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.ensureRenders?.()
      }
    }
  }
}

const LA_F_3: RubricItem<LiveArtifactsFrontmatterContext> = {
  code: 'LA-F-3',
  title: 'artifact owner',
  description: 'Each artifact source declares the author who owns and maintains it.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.author }
  }
}

export const LA_FRONTMATTER: RubricFamily<LiveArtifactsRubricContext, LiveArtifactsFrontmatterContext> = {
  code: 'LA-F',
  title: 'artifact frontmatter',
  description: 'Required metadata on Markdown artifact sources.',
  standard: SOURCE,
  selectContext: (context) => context.frontmatter,
  items: [LA_F_1, LA_F_2, LA_F_3]
}
