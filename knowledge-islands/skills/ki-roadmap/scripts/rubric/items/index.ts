import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createRoadmapSession, type RoadmapRubricContext } from '../contexts/roadmap.ts'
import { EXPAND } from './expand.ts'
import { HANDOFF } from './handoffs.ts'
import { ITEM } from './item.ts'
import { PLAN } from './plans.ts'
import { PROFILE } from './profile.ts'
import { PROJ } from './proj.ts'
import { ROAD } from './roadmaps.ts'
import { SAFE } from './safety.ts'
import { SCOPE } from './scope.ts'
import { THEME } from './themes.ts'

export default {
  contract: 1,
  name: 'ki-roadmap',
  concern: 'repository roadmaps',
  createSession: createRoadmapSession,
  families: [SCOPE, PROFILE, ROAD, THEME, ITEM, PROJ, PLAN, SAFE, EXPAND, HANDOFF]
} satisfies SkillRubricDefinition<RoadmapRubricContext>
