import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createTokenomicsSession, type TokenomicsRubricContext } from '../contexts/tokenomics.ts'
import { CFG } from './config.ts'
import { POL } from './policy.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-tokenomics',
  concern: 'Portable agent-context tokenomics policy',
  createSession: createTokenomicsSession,
  families: [CFG, POL, RUBRIC]
} satisfies SkillRubricDefinition<TokenomicsRubricContext>
