import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { PaperclipCoordinationContext } from '../contexts/coordination.ts'

export const RUBRIC = createRubricPublicationFamily<PaperclipCoordinationContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
