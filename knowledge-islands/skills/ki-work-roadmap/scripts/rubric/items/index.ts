import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createRoadmapSession, type RoadmapRubricContext } from '../contexts/roadmap.ts'
import { ITEM } from './item.ts'
import { EXEC } from './plans.ts'
import { INDEX } from './proj.ts'
import { RUBRIC } from './publication.ts'
import { ROAD } from './roadmaps.ts'
import { SAFE } from './safety.ts'
import { SCOPE } from './scope.ts'
import { TRADE } from './trades.ts'

export default {
  contract: 1,
  name: 'ki-work-roadmap',
  concern: 'repository roadmaps',
  createSession: createRoadmapSession,
  families: [RUBRIC, SCOPE, ROAD, ITEM, INDEX, EXEC, SAFE, TRADE]
} satisfies SkillRubricDefinition<RoadmapRubricContext>
