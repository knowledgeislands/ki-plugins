import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { LiveArtifactsRubricContext, LiveArtifactsStructureContext } from '../contexts/live-artifacts.ts'

const SOURCE = 'standards-live-artifacts.md'

const LA_S_1: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-S-1',
  title: 'artifact index',
  description: 'The index note exists when artifact sources are present and may safely gain omitted source names.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'automatic' },
    conformOn: ['INFO'],
    audit: { phase: 'INSPECT', run: (context) => context.index },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.ensureIndex?.()
      }
    }
  }
}

const LA_S_2: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-S-2',
  title: 'published sources',
  description: 'Every Markdown artifact has a same-stem HTML render.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Render or correct the artifact source through the responsible owner.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.publishedSources }
  }
}

const LA_S_3: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-S-3',
  title: 'orphaned renders',
  description: 'Every HTML render has a same-stem Markdown source.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Restore or retire the orphaned render through the responsible owner.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.orphanedRenders }
  }
}

const LA_S_4: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-S-4',
  title: 'render freshness',
  description: 'Each HTML render is no older than the configured threshold behind its Markdown source.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'diagnostic', guidance: 'Refresh the rendered artifact through the responsible owner.' },
    audit: { phase: 'DERIVED', run: (context) => context.freshness }
  }
}

const LA_J_1: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-J-1',
  title: 'useful index descriptions',
  description: 'The index accurately lists active artifacts with useful one-line descriptions.',
  sources: [SOURCE],
  judgment: {
    scope: 'The live-artifact index and every active artifact.',
    prompt: 'Does the index accurately list every active artifact with a useful one-line description?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Correct the index, record a named gap, or record an explicit justified exclusion.'
  }
}

const LA_J_2: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-J-2',
  title: 'Markdown authority',
  description: 'Markdown is the authoritative source and no content exists only in HTML.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every Markdown live artifact and its rendered representation.',
    prompt: 'Is each Markdown artifact authoritative, with no essential content present only in its HTML render?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Restore Markdown authority, record a named gap, or record an explicit justified exclusion.'
  }
}

const LA_J_3: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-J-3',
  title: 'archive rationale',
  description: 'Archived artifacts retain when-and-why context rather than disappearing silently.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every archived live artifact and its retained rationale.',
    prompt: 'Do archived artifacts retain a clear when-and-why rationale rather than disappearing silently?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Add the retained rationale, record a named gap, or record an explicit justified exclusion.'
  }
}

const LA_J_4: RubricItem<LiveArtifactsStructureContext> = {
  code: 'LA-J-4',
  title: 'stable artifact names',
  description: 'Artifact names are descriptive and stable for published links.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every active and archived artifact filename and its published links.',
    prompt: 'Are artifact names descriptive and stable enough to preserve published links?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Rename only with responsible-owner approval and preserve links; otherwise record a gap or explicit exclusion.'
  }
}

export const LA_STRUCTURE: RubricFamily<LiveArtifactsRubricContext, LiveArtifactsStructureContext> = {
  code: 'LA',
  title: 'artifact structure',
  description: 'Artifact pairing, index, freshness, and judgment prompts.',
  standard: SOURCE,
  selectContext: (context) => context.structure,
  items: [LA_S_1, LA_S_2, LA_S_3, LA_S_4, LA_J_1, LA_J_2, LA_J_3, LA_J_4]
}
