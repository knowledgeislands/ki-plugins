import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EnactmentRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-enactment-process.md'

const ENACT_1: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-1',
  title: 'proposal frontmatter',
  description: 'Each proposal declares status, priority, and dependencies in closed frontmatter.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.proposalFrontmatter, 'WARN', ['FAIL']) }
  }
}

const ENACT_2: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-2',
  title: 'lifecycle status and priority',
  description: 'Proposal status and priority are bare tokens from the controlled vocabularies.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.lifecycle, 'WARN') },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.normaliseLifecycle?.()
      }
    }
  }
}

const ENACT_3: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-3',
  title: 'Governance section',
  description: 'Every stream note declares and links its bound process note.',
  sources: [SOURCE],
  judgment: { prompt: 'Do sampled stream notes carry an appropriate Governance section?' }
}

const ENACT_4: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-4',
  title: 'index accuracy',
  description: 'Focus and proposal indexes match the live streams and statuses.',
  sources: [SOURCE],
  judgment: { prompt: 'Do indexes accurately reflect live streams and statuses?' }
}

const ENACT_5: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-5',
  title: 'completed-proposal settlement',
  description: 'Completed proposals are deleted after their output reaches a canonical zone.',
  sources: [SOURCE],
  judgment: {
    prompt: 'Have completed proposals been deleted only after their output settled into the appropriate store?'
  }
}

export const ENACT: RubricFamily<StreamsRubricContext, EnactmentRubricContext> = {
  code: 'ENACT',
  title: 'Enactment Process',
  description: 'Proposal frontmatter, lifecycle, and settlement.',
  standard: SOURCE,
  selectContext: (context) => context.enactment,
  items: [ENACT_1, ENACT_2, ENACT_3, ENACT_4, ENACT_5]
}
