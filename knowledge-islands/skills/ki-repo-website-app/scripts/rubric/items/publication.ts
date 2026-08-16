import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { WebsiteAppContext } from '../contexts/website-app.ts'
export const RUBRIC = createRubricPublicationFamily<WebsiteAppContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
