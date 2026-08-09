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
      description:
        'Environment-capable repos commit an `.env*.example` template; no environment capability is not applicable.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Add an appropriately redacted environment example template for the declared capability, then rerun the audit.'
        },
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
        remediation: {
          class: 'diagnostic',
          guidance: 'Confine `NODE_ENV=development` to development or inspection scripts, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.env2, 'FAIL') }
      }
    },
    {
      code: 'ENV-3',
      title: 'Real environment files are protected',
      description: 'Real non-example `.env.*` files are gitignored and the loader has the Node parity call.',
      sources: ['standards-engineering.md'],
      judgment: {
        scope: 'Real environment files and every loader that reads them.',
        prompt: 'Are real environment files ignored and is the loader Node-parity-safe?',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance: 'Protect the files and loader, record a named Gap, or record an explicit capability exclusion.'
      }
    },
    {
      code: 'ENV-4',
      title: 'XDG paths are honoured',
      description:
        'Config, data, cache, and state paths honour the matching `$XDG_*` variable before falling back to the specification default.',
      sources: ['standards-engineering.md'],
      judgment: {
        scope: 'All repository-owned config, data, cache, and state path resolution.',
        prompt: 'Do config, data, cache, and state paths honour the appropriate XDG environment variable?',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance:
          'Use the matching XDG variable before its specification default, record a named Gap, or record an explicit exclusion.'
      }
    }
  ]
}
