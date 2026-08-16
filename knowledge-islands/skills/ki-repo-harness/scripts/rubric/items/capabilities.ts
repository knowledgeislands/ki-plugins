import { AUTOMATIC_REMEDIATION, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type {
  HarnessCapabilityPublicationContext,
  HarnessReviewContext,
  HarnessRubricContext
} from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#capability-publication'] as const

type CapabilitiesContext = HarnessReviewContext & { publication: HarnessCapabilityPublicationContext }

const CAP_1: RubricItem<CapabilitiesContext> = {
  code: 'CAP-1',
  title: 'Capability inventory and boundaries',
  description:
    'Each populated harness shelf makes its typed capabilities discoverable and routes their content and runtime semantics to the owning kind standard.',
  sources: STANDARD,
  judgment: {
    scope: 'Every populated source shelf, its compatible payload representation, and the owning kind standards.',
    prompt:
      'Review each populated shelf: are its capabilities discoverable through the compatible payload, and are kind-specific semantics delegated to the appropriate standard?',
    outcomes: ['conforming', 'inventory revision', 'route to owning standard'],
    guidance:
      'Revise the inventory or route the concern to its owning standard; do not alter a capability’s runtime semantics from this container-level review.'
  }
}

const CAP_2: RubricItem<CapabilitiesContext> = {
  code: 'CAP-2',
  title: 'Generated capability catalogue is exact',
  description:
    'A populated skills shelf publishes one marker-bounded catalogue in `skills/README.md`, derived exactly from canonical skill frontmatter and safely replaceable without changing authored surrounding guidance.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    remediation: AUTOMATIC_REMEDIATION,
    audit: {
      phase: 'DERIVED',
      run: ({ publication }) => {
        if (publication.state === 'in-sync')
          return [
            { status: 'PASS', message: 'The generated capability catalogue is exact.', subject: 'skills/README.md' }
          ]
        if (publication.state === 'unsafe')
          return publication.issues.map((message) => ({ status: 'VIOLATION', message, subject: 'skills/README.md' }))
        return [
          {
            status: 'VIOLATION',
            message:
              publication.state === 'missing'
                ? 'The generated capability catalogue is missing from skills/README.md.'
                : 'The generated capability catalogue differs from canonical SKILL.md frontmatter.',
            subject: 'skills/README.md'
          }
        ]
      }
    },
    conform: {
      phase: 'DERIVED',
      run: ({ publication }) => {
        if (publication.state !== 'in-sync') publication.requestUpdate?.()
      }
    }
  }
}

export const CAP: RubricFamily<HarnessRubricContext, CapabilitiesContext> = {
  code: 'CAP',
  title: 'Capability publication',
  description: 'Typed compatible-harness capability inventory and kind-specific boundaries.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => ({ ...context.review, publication: context.capabilityPublication }),
  items: [CAP_1, CAP_2]
}
