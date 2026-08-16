import type { RubricFamily } from '../../shared/rubric.ts'
import type { DesignRubricContext, EngineeringRubricContext } from '../contexts/engineering.ts'

export const DESIGN: RubricFamily<EngineeringRubricContext, DesignRubricContext> = {
  code: 'DESIGN',
  title: 'Code design',
  description: 'Comprehension-first modularity and deliberately restrained abstraction.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.design,
  items: [
    {
      code: 'DESIGN-1',
      title: 'Comprehension-first design',
      description:
        'Code keeps modules cohesive, makes important policies and ordinary control flow clear, and extracts reuse only for a stable shared concept.',
      sources: ['standards-engineering.md#code-design'],
      judgment: {
        scope: 'Source modules, their imports and callers, public boundaries, and the corresponding contract tests.',
        prompt:
          'Do module boundaries match domain concerns and reasons to change; can a maintainer follow ordinary control flow and policy from clear names and interfaces; and does each shared abstraction retain the same meaning, lifecycle, and error semantics for every caller?',
        outcomes: ['conforming', 'gap', 'exception'],
        guidance:
          'Split a mixed-responsibility module at a domain seam, simplify or name an obscuring abstraction, or retain documented local duplication where it makes the domain clearer.'
      }
    }
  ]
}
