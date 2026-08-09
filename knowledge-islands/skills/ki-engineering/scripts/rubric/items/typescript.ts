import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type TypescriptRubricContext } from '../contexts/engineering.ts'

export const TYPESCRIPT: RubricFamily<EngineeringRubricContext, TypescriptRubricContext> = {
  code: 'TSC',
  title: 'TypeScript',
  description: 'The TypeScript gate and universal strict compiler invariants.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.typescript,
  items: [
    {
      code: 'TSC-1',
      title: 'Type-check passes',
      description:
        '`tsc --noEmit` exits clean at the root, or each declared workspace has a clean `tsc --noEmit -p <workspace>/tsconfig.json`.',
      sources: ['standards-engineering.md'],
      mechanical: {
        // Dearer than the gates above it in a workspace repo, where it runs once per project.
        level: 'FAIL',
        cost: 5,
        remediation: {
          class: 'diagnostic',
          guidance: 'Resolve the reported TypeScript errors in the affected project, then rerun the type-check.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.tsc1, 'FAIL') }
      }
    },
    {
      code: 'TSC-2',
      title: 'Universal TypeScript invariants',
      description:
        '`tsconfig.json` exists with strict, NodeNext, noEmit, isolatedModules, esModuleInterop, and skipLibCheck invariants.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        remediation: { class: 'automatic' },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.tsc2, 'FAIL') },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    },
    {
      code: 'TSC-3',
      title: 'Strictness is not weakened',
      description: 'No repo loosens `strict` or the `noUnused*` and `noImplicit*` flags.',
      sources: ['standards-engineering.md'],
      judgment: {
        scope: 'The effective root and workspace TypeScript configurations.',
        prompt: 'Does the effective TypeScript configuration preserve the required strictness flags?',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance:
          'Restore the required strictness flags, record a named Gap, or record an explicit capability exclusion.'
      }
    }
  ] satisfies readonly RubricItem<TypescriptRubricContext>[]
}
