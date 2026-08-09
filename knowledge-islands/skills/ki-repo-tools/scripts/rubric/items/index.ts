import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createToolsSession, type ToolsRubricContext } from '../contexts/tools.ts'
import { COMPLETION } from './completion.ts'
import { CONFIG } from './config.ts'
import { LANG } from './language.ts'
import { MAN } from './manual.ts'
import { RUBRIC } from './publication.ts'
import { SHELL } from './shell.ts'
import { TOOL } from './tool.ts'

export default {
  contract: 1,
  name: 'ki-repo-tools',
  concern: 'command-line tool repository structure',
  createSession: createToolsSession,
  families: [RUBRIC, TOOL, SHELL, LANG, COMPLETION, MAN, CONFIG]
} satisfies SkillRubricDefinition<ToolsRubricContext>
