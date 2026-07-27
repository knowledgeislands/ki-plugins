import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type BiomeRubricContext, type EngineeringRubricContext } from '../contexts/engineering.ts'

export const BIOME: RubricFamily<EngineeringRubricContext, BiomeRubricContext> = {
  code: 'BIO',
  title: 'Biome',
  description: 'The read-only code-quality gate and shared formatter/linter configuration.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.biome,
  items: [
    {
      code: 'BIO-1',
      title: 'Biome read-only gate passes',
      description: '`bunx @biomejs/biome check` exits clean.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.bio1, 'FAIL') },
        conform: { phase: 'NORMALISE', run: (context) => context.normalise?.() }
      }
    },
    {
      code: 'BIO-2',
      title: 'Biome shared configuration',
      description: '`biome.json` exists and matches the shared formatter, JavaScript formatter, linter, and import-organisation field set.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        overrideLevels: ['WARN'],
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.bio2, 'FAIL', ['WARN']) },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    }
  ]
}
