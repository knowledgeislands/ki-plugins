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
        cost: 4,
        remediation: {
          class: 'guarded',
          guidance: 'Review the reported Biome findings and apply the appropriate source changes, then rerun the gate.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.bio1, 'FAIL') }
      },
      judgment: {
        scope: 'Every reported Biome finding and its proposed source change.',
        prompt:
          'Would the proposed formatting, lint, or unsafe correction preserve the intended behaviour and public surface?',
        outcomes: ['apply', 'manual-fix', 'exclusion'],
        guidance:
          'Apply only a reviewed safe correction, make the intended manual fix, or record an explicit exclusion.'
      }
    },
    {
      code: 'BIO-2',
      title: 'Biome shared configuration',
      description:
        '`biome.json` exists and matches the shared formatter, JavaScript formatter, linter, and import-organisation field set.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        overrideLevels: ['WARN'],
        remediation: { class: 'automatic' },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.bio2, 'FAIL', ['WARN']) },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    }
  ]
}
