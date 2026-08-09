import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { WebsiteCloudflareRubricContext } from '../contexts/website-cloudflare.ts'

export const RUBRIC = createRubricPublicationFamily<WebsiteCloudflareRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
