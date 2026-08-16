import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createHarnessSession, type HarnessRubricContext } from '../contexts/harness.ts'
import { CAP } from './capabilities.ts'
import { CLAUDE } from './claude.ts'
import { COLL } from './collision.ts'
import { CONFIG } from './config.ts'
import { LAY } from './layout.ts'
import { LONG } from './longevity.ts'
import { PAYLOAD } from './payload.ts'
import { RUBRIC } from './publication.ts'
import { SKILLS } from './skills.ts'

export default {
  contract: 1,
  name: 'ki-repo-harness',
  concern: 'Knowledge Islands compatible harnesses',
  createSession: createHarnessSession,
  families: [CAP, PAYLOAD, LAY, CLAUDE, CONFIG, SKILLS, LONG, COLL, RUBRIC]
} satisfies SkillRubricDefinition<HarnessRubricContext>
