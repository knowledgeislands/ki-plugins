import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createHousekeepingSession, type HousekeepingRubricContext } from '../contexts/housekeeping.ts'
import { DOC } from './doc.ts'
import { FRONTMATTER } from './frontmatter.ts'
import { INDEX } from './indexing.ts'
import { LINK } from './link.ts'
import { RUBRIC } from './publication.ts'
import { RUNTIME } from './runtime.ts'
import { SELECTION } from './selection.ts'

type HousekeepingDefinition = SkillRubricDefinition<HousekeepingRubricContext> & {
  scope: {
    kind: 'user-home'
    paths: readonly string[]
  }
}

export default {
  contract: 1,
  name: 'ki-housekeeping-claude',
  concern: 'Claude state housekeeping',
  scope: { kind: 'user-home', paths: ['.claude/projects'] },
  createSession: createHousekeepingSession,
  families: [SELECTION, RUNTIME, INDEX, FRONTMATTER, LINK, DOC, RUBRIC]
} satisfies HousekeepingDefinition
