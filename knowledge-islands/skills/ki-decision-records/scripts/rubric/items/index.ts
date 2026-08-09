import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createDecisionRecordsSession, type DecisionRecordsRubricContext } from '../contexts/decision-records.ts'
import { BODY } from './body.ts'
import { FILENAME } from './filename.ts'
import { FM } from './frontmatter.ts'
import { INDEX } from './index-records.ts'
import { RUBRIC } from './publication.ts'
import { ROOT } from './root.ts'
import { TYPE_FIT } from './type-fit.ts'

export default {
  contract: 1,
  name: 'ki-decision-records',
  concern: 'decision records',
  createSession: createDecisionRecordsSession,
  families: [RUBRIC, FILENAME, ROOT, FM, TYPE_FIT, BODY, INDEX]
} satisfies SkillRubricDefinition<DecisionRecordsRubricContext>
