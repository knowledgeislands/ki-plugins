import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createHousekeepingSession, type HousekeepingRubricContext } from '../contexts/housekeeping.ts'
import { DOC } from './doc.ts'
import { FRONTMATTER } from './frontmatter.ts'
import { INDEX } from './indexing.ts'
import { LINK } from './link.ts'
import { SELF } from './self.ts'

type HousekeepingDefinition = SkillRubricDefinition<HousekeepingRubricContext> & {
  scope: {
    kind: 'user-home'
    paths: readonly string[]
  }
}

export default {
  contract: 1,
  name: 'ki-housekeeping',
  concern: 'Claude state housekeeping',
  scope: { kind: 'user-home', paths: ['.claude/projects'] },
  createSession: createHousekeepingSession,
  families: [SELF, INDEX, FRONTMATTER, LINK, DOC]
} satisfies HousekeepingDefinition
