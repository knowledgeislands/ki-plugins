import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createSpecsSession, type SpecsRubricContext } from '../contexts/specs.ts'
import { AREA } from './area.ts'
import { AREA_FIT } from './area-fit.ts'
import { AS_BUILT } from './as-built.ts'
import { BEHAVIOUR } from './behaviour.ts'
import { DR_LINK } from './decision-link.ts'
import { ID } from './identity.ts'
import { INDEX } from './index-family.ts'
import { RUBRIC } from './publication.ts'
import { REQ } from './requirement.ts'
import { SPLIT } from './split.ts'
import { VERIFY } from './verification.ts'

export default {
  contract: 1,
  name: 'ki-specs',
  concern: 'Specifications',
  createSession: createSpecsSession,
  families: [RUBRIC, INDEX, AREA, ID, REQ, VERIFY, BEHAVIOUR, AS_BUILT, SPLIT, DR_LINK, AREA_FIT]
} satisfies SkillRubricDefinition<SpecsRubricContext>
