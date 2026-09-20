import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type BunRubricContext, type EngineeringRubricContext } from '../contexts/engineering.ts'

export const BUN: RubricFamily<EngineeringRubricContext, BunRubricContext> = {
  code: 'BUN',
  title: 'Bun and Node runtime boundary',
  description: 'Environment loading remains equivalent when built output runs under Node.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.bun,
  items: [
    {
      code: 'BUN-1',
      title: 'Node environment-loading parity',
      description:
        'Where the repo loads `.env`, `loadConfig` (or equivalent) calls `process.loadEnvFile()` in a try/catch for Node parity.',
      sources: ['standards-engineering.md'],
      judgment: {
        scope: 'Every repository configuration loader that reads `.env` files.',
        prompt: 'Where `.env` is loaded, does the loader call `process.loadEnvFile()` safely?',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance: 'Add the guarded Node parity call, record a named Gap, or record an explicit capability exclusion.'
      }
    },
    {
      code: 'BUN-2',
      title: 'Authored scripts and configuration are TypeScript-first',
      description:
        'Tracked repository scripts and tool configuration avoid `.mjs`; Bun executes authored TypeScript directly while Node remains the compiled consumer runtime.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: {
          phase: 'INSPECT',
          run: (context) => auditEvidence(context.bun2, 'FAIL')
        },
        remediation: {
          class: 'diagnostic',
          guidance:
            'Rename each tracked `.mjs` source or configuration file to `.ts`, update its callers to use Bun, and verify the consuming tool supports TypeScript.'
        }
      }
    }
  ]
}
