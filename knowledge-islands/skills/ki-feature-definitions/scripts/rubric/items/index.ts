import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createFeatureDefinitionsSession, type FeatureDefinitionsRubricContext } from '../contexts/feature-definitions.ts'
import { AREA } from './area.ts'
import { AREA_FIT } from './area-fit.ts'
import { AS_BUILT } from './as-built.ts'
import { BEHAVIOUR } from './behaviour.ts'
import { DR_LINK } from './decision-link.ts'
import { ID } from './identity.ts'
import { INDEX } from './index-family.ts'
import { REQ } from './requirement.ts'
import { SPLIT } from './split.ts'
import { VERIFY } from './verification.ts'

export default {
  contract: 1,
  name: 'ki-feature-definitions',
  concern: 'Feature Definitions',
  createSession: createFeatureDefinitionsSession,
  families: [INDEX, AREA, ID, REQ, VERIFY, BEHAVIOUR, AS_BUILT, SPLIT, DR_LINK, AREA_FIT]
} satisfies SkillRubricDefinition<FeatureDefinitionsRubricContext>
