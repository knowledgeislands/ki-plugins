import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createRepoSession, type RepoRubricContext } from '../contexts/repository.ts'
import { ACCESS } from './access.ts'
import { ACT } from './actions.ts'
import { BP } from './branch-protection.ts'
import { CHECKS } from './checks.ts'
import { COV } from './coverage.ts'
import { DEP } from './dependencies.ts'
import { DESCFIT } from './description-fit.ts'
import { FILES } from './files.ts'
import { GH } from './gh.ts'
import { KIND } from './kind.ts'
import { MERGE } from './merge.ts'
import { OVR } from './overrides.ts'
import { PKG } from './pkg.ts'
import { RUBRIC } from './publication.ts'
import { RUNTIMES } from './runtimes.ts'
import { SEC } from './secrets.ts'
import { STRUCT } from './structure.ts'
import { SYNC } from './sync.ts'
import { TOGGLE } from './toggle.ts'
import { TOPICS } from './topics.ts'
import { VIS } from './visibility.ts'
import { WORK } from './working-areas.ts'

export default {
  contract: 1,
  name: 'ki-repo',
  concern: 'Knowledge Islands repositories',
  createSession: createRepoSession,
  families: [
    RUBRIC,
    FILES,
    GH,
    PKG,
    MERGE,
    TOGGLE,
    VIS,
    TOPICS,
    BP,
    DEP,
    SEC,
    ACT,
    CHECKS,
    COV,
    STRUCT,
    ACCESS,
    KIND,
    RUNTIMES,
    DESCFIT,
    OVR,
    SYNC,
    WORK
  ]
} satisfies SkillRubricDefinition<RepoRubricContext>
