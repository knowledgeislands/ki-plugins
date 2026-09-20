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
    },
    {
      code: 'DESIGN-2',
      title: 'Module boundaries are stated and enforced',
      description:
        'Boundaries the repository relies on — layer direction, logic-free artifact shells, and the seam its tests exercise — are declared as dependency-cruiser rules, cruised over a graph proved to resolve, and covered by a test that proves the checker can still fail.',
      sources: ['standards-engineering.md#repo-shapes--flat-vs-monorepo-core'],
      judgment: {
        scope:
          'Declared module boundaries, `.dependency-cruiser.ts` rules and the roots they cruise, its resolution and transpiler configuration, the script that runs them, and the test that proves the checker still reports violations.',
        prompt:
          'Does every boundary the design depends on have a forbidden rule that a violating import would actually trip, does the cruise cover each root those rules name and resolve the imports they match on, and does a test prove the checker fails on a deliberate violation rather than reporting a clean graph it never read?',
        outcomes: ['conforming', 'gap', 'exception'],
        guidance:
          'State the missing boundary as a forbidden rule, widen the cruise to the roots its rules name, configure resolution and the transpiler so the graph is real, add the failure-proving test with its module floor, or record why a boundary is a convention this repository deliberately leaves unchecked.'
      }
    }
  ]
}
