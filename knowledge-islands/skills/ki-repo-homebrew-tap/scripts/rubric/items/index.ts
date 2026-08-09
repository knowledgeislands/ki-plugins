import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createHomebrewTapSession, type HomebrewTapRubricContext } from '../contexts/homebrew-tap.ts'
import { CONFIG } from './config.ts'
import { RUBRIC } from './publication.ts'
import { TAP } from './tap.ts'

export default {
  contract: 1,
  name: 'ki-repo-homebrew-tap',
  concern: 'Homebrew tap structure',
  createSession: createHomebrewTapSession,
  families: [RUBRIC, TAP, CONFIG]
} satisfies SkillRubricDefinition<HomebrewTapRubricContext>
