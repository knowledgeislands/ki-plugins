import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { TokenomicsRubricContext } from '../contexts/tokenomics.ts'

export const RUBRIC = createRubricPublicationFamily<TokenomicsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
