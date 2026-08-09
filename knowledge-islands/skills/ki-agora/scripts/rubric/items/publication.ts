import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { AgoraRubricContext } from '../contexts/agora.ts'

export const RUBRIC = createRubricPublicationFamily<AgoraRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
