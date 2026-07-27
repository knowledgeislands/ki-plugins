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
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.tsc1, 'FAIL') }
      }
    },
    {
      code: 'TSC-2',
      title: 'Universal TypeScript invariants',
      description: '`tsconfig.json` exists with strict, NodeNext, noEmit, isolatedModules, esModuleInterop, and skipLibCheck invariants.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.tsc2, 'FAIL') },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    },
    {
      code: 'TSC-3',
      title: 'Strictness is not weakened',
      description: 'No repo loosens `strict` or the `noUnused*` and `noImplicit*` flags.',
      sources: ['standards-engineering.md'],
      judgment: { prompt: 'Does the effective TypeScript configuration preserve the required strictness flags?' }
    }
  ] satisfies readonly RubricItem<TypescriptRubricContext>[]
}
