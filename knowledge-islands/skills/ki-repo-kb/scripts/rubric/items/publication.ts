import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { KbRubricContext } from '../contexts/kb.ts'

export const RUBRIC = createRubricPublicationFamily<KbRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
