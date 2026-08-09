import { createRubricPublicationFamily } from '../../shared/rubric.ts'
import type { LiveArtifactsRubricContext } from '../contexts/live-artifacts.ts'

export const RUBRIC = createRubricPublicationFamily<LiveArtifactsRubricContext>(
  ({ rubric }) => rubric,
  '../../../keystone/ki-skills/references/standards-rubric-authoring.md',
  ['../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication']
)
