import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

export const RUBRIC = createRubricPublicationFamily<KiSkillsRubricContext>(
  (context) => selectKiSkillsContext(context, 'rubric'),
  'standards-rubric-authoring.md',
  ['standards-rubric-authoring.md#generated-rubric-publication']
)
