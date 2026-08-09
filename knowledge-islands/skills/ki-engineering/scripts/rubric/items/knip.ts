import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type KnipRubricContext } from '../contexts/engineering.ts'

export const KNIP: RubricFamily<EngineeringRubricContext, KnipRubricContext> = {
  code: 'KNIP',
  title: 'Knip',
  description: 'The unused-code configuration and gate.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.knip,
  items: [
    {
      code: 'KNIP-1',
      title: 'Knip configuration exists',
      description: '`knip.json` exists with per-repo entry points and ignores.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        remediation: { class: 'automatic' },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knip1, 'FAIL') },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    },
    {
      code: 'KNIP-2',
      title: 'Knip gate passes',
      description: '`bunx knip` exits clean.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        cost: 8,
        remediation: {
          class: 'guarded',
          guidance:
            'Review each reported unused symbol or dependency and make the intended source or configuration change, then rerun Knip.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knip2, 'FAIL') }
      },
      judgment: {
        scope: 'Every unused-code or dependency finding reported by Knip.',
        prompt:
          'Is each finding genuinely unused, or does it represent a runtime, generated, or public surface that needs configuration rather than deletion?',
        outcomes: ['remove', 'configure', 'exclusion'],
        guidance:
          'Remove genuinely unused code, protect a valid surface in configuration, or record an explicit exclusion.'
      }
    },
    {
      code: 'KNIP-3',
      title: 'Knip entry points cover every package export',
      description:
        'Every target in the `exports` map of `package.json` is reachable from at least one glob in the `entry` list of `knip.json`, mapping the built path back to its source (`./dist/X.js` and `./dist/X.d.ts` map to `src/X.ts`); `./package.json` is exempt. An unreachable published entrypoint is invisible to knip as a public surface, so the KNIP-2 repair deletes genuine public API. Audit only — which entry glob to add is a judgment call, so there is no conform action.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Add the intended source entry glob to `knip.json` so the published export is protected, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knip3, 'FAIL') }
      }
    }
  ]
}
