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
    remediation: {
      class: 'diagnostic',
      guidance:
        'Add or correct closed proposal frontmatter to reflect the proposal’s actual status, priority, and dependencies.'
    },
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
    remediation: { class: 'automatic' },
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
  judgment: {
    scope: 'Sampled stream notes and their bound process-note links.',
    prompt: 'Do sampled stream notes carry an appropriate Governance section?',
    outcomes: ['conforming', 'governance link required', 'process-boundary decision required'],
    guidance:
      'Add the appropriate bound process-note link, or record the governing decision where the note intentionally follows a different process boundary.'
  }
}

const ENACT_4: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-4',
  title: 'index accuracy',
  description: 'Focus and proposal indexes match the live streams and statuses.',
  sources: [SOURCE],
  judgment: {
    scope: 'Focus and proposal indexes, live streams, and their lifecycle statuses.',
    prompt: 'Do indexes accurately reflect live streams and statuses?',
    outcomes: ['conforming', 'index update required', 'lifecycle correction required'],
    guidance:
      'Update the index from the canonical live stream or correct the stream lifecycle state before publishing an index claim.'
  }
}

const ENACT_5: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-5',
  title: 'done-proposal retention',
  description: 'Done proposals retain their reviewed evidence until an explicit prune selection removes them.',
  sources: [SOURCE],
  judgment: {
    scope: 'Done proposals, their reviewed evidence, canonical outputs, and any prune selection.',
    prompt: 'Do done proposals retain their review evidence and canonical outputs until an explicit prune selection?',
    outcomes: ['conforming', 'retain evidence', 'explicit prune selection required'],
    guidance:
      'Restore or retain the reviewed evidence and canonical outputs until an explicit owner-approved prune selection names the proposal.'
  }
}

const ENACT_6: RubricItem<EnactmentRubricContext> = {
  code: 'ENACT-6',
  title: 'proposal codes',
  description: 'Each proposal declares a well-formed code unique across the Knowledge Base.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Assign an explicit owner-approved code, or resolve the duplicate without deriving, allocating, renumbering, or rewriting a proposal identity.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.proposalCodes, 'FAIL') }
  }
}

export const ENACT: RubricFamily<StreamsRubricContext, EnactmentRubricContext> = {
  code: 'ENACT',
  title: 'Enactment Process',
  description: 'Proposal frontmatter, lifecycle, and settlement.',
  standard: SOURCE,
  selectContext: (context) => context.enactment,
  items: [ENACT_1, ENACT_2, ENACT_3, ENACT_4, ENACT_5, ENACT_6]
}
