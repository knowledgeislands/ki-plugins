import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type EnvironmentRubricContext } from '../contexts/engineering.ts'

export const ENVIRONMENT: RubricFamily<EngineeringRubricContext, EnvironmentRubricContext> = {
  code: 'ENV',
  title: 'Environment configuration',
  description: 'Environment templates, development-mode confinement, and portable paths.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.environment,
  items: [
    {
      code: 'ENV-1',
      title: 'Environment example template',
      description: 'Environment-capable repos commit an `.env*.example` template; no environment capability is not applicable.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.env1, 'WARN') }
      }
    },
    {
      code: 'ENV-2',
      title: 'Development NODE_ENV confinement',
      description: '`NODE_ENV=development` appears only in dev or inspect scripts, never start, build, or test.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.env2, 'FAIL') }
      }
    },
    {
      code: 'ENV-3',
      title: 'Real environment files are protected',
      description: 'Real non-example `.env.*` files are gitignored and the loader has the Node parity call.',
      sources: ['standards-engineering.md'],
      judgment: { prompt: 'Are real environment files ignored and is the loader Node-parity-safe?' }
    },
    {
      code: 'ENV-4',
      title: 'XDG paths are honoured',
      description:
        'Config, data, cache, and state paths honour the matching `$XDG_*` variable before falling back to the specification default.',
      sources: ['standards-engineering.md'],
      judgment: { prompt: 'Do config, data, cache, and state paths honour the appropriate XDG environment variable?' }
    }
  ]
}
