import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { PrincipalContext } from '../contexts/principal.ts'

const SOURCE = 'standards-principal.md'

const PRINCIPAL_1: RubricItem<PrincipalContext> = {
  code: 'PRINCIPAL-1',
  title: 'principal governance surface exists',
  description: 'A principal base carries the required governance, memory, and Enactment Process entry points.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Create or restore the missing principal governance entry point through the principal owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        context.missing.length
          ? context.missing.map((subject) => ({
              status: 'VIOLATION',
              message: 'Missing or unsafe principal entry point.',
              subject
            }))
          : [{ status: 'PASS', message: 'The principal governance surface is present.' }]
    }
  }
}
const PRINCIPAL_2: RubricItem<PrincipalContext> = {
  code: 'PRINCIPAL-2',
  title: 'Enactment gate is anchored',
  description: 'Always-loaded repository guidance names the Enactment Process or enactment gate.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Anchor the Enactment Process in the authoritative repository guidance through the principal owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        context.enactmentAnchor
          ? { status: 'PASS', message: 'The Enactment gate is anchored in repository orientation.' }
          : {
              status: 'VIOLATION',
              message: 'Anchor the Enactment Process in CLAUDE.md or AGENTS.md.',
              subject: 'CLAUDE.md / AGENTS.md'
            }
      ]
    }
  }
}

export const PRINCIPAL: RubricFamily<PrincipalContext, PrincipalContext> = {
  code: 'PRINCIPAL',
  title: 'principal governance',
  description: 'Principal-only governance surface and enactment anchor.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [PRINCIPAL_1, PRINCIPAL_2]
}
