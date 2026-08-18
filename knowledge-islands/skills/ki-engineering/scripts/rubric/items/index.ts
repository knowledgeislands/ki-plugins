import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createEngineeringSession, type EngineeringRubricContext } from '../contexts/engineering.ts'
import { BIOME } from './biome.ts'
import { BUILD } from './build.ts'
import { BUN } from './bun.ts'
import { CI } from './ci.ts'
import { DEPENDENCIES } from './dependencies.ts'
import { DESIGN } from './design.ts'
import { ENVIRONMENT } from './environment.ts'
import { GENERATED } from './generated.ts'
import { KNIP } from './knip.ts'
import { MISE } from './mise.ts'
import { PACKAGE } from './package.ts'
import { RUBRIC } from './publication.ts'
import { REVIEW } from './review.ts'
import { SCRIPTS } from './scripts.ts'
import { SYNC } from './sync.ts'
import { TEST } from './test.ts'
import { TOML } from './toml.ts'
import { TYPESCRIPT } from './typescript.ts'

export default {
  contract: 1,
  name: 'ki-engineering',
  concern: 'Knowledge Islands engineering standards',
  packageScripts: ['ki:deps:update'],
  createSession: createEngineeringSession,
  families: [
    RUBRIC,
    PACKAGE,
    MISE,
    CI,
    SCRIPTS,
    BUN,
    TYPESCRIPT,
    BIOME,
    KNIP,
    SYNC,
    DEPENDENCIES,
    GENERATED,
    DESIGN,
    REVIEW,
    TEST,
    BUILD,
    ENVIRONMENT,
    TOML
  ]
} satisfies SkillRubricDefinition<EngineeringRubricContext>
