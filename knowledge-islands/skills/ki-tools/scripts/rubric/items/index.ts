import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createToolsSession, type ToolsRubricContext } from '../contexts/tools.ts'
import { CONFIG } from './config.ts'
import { LANG } from './language.ts'
import { SHELL } from './shell.ts'
import { TOOL } from './tool.ts'

export default {
  contract: 1,
  name: 'ki-tools',
  concern: 'command-line tool repository structure',
  createSession: createToolsSession,
  families: [TOOL, SHELL, LANG, CONFIG]
} satisfies SkillRubricDefinition<ToolsRubricContext>
