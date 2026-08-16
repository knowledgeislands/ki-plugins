import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { WebsiteContext } from '../contexts/website.ts'

export const RUBRIC = createRubricPublicationFamily<WebsiteContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
