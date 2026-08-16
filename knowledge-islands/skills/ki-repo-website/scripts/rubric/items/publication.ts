import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { WebsiteCoreContext } from '../contexts/website.ts'

export const RUBRIC = createRubricPublicationFamily<WebsiteCoreContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
