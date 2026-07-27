import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createKbSession, type KbRubricContext } from '../contexts/kb.ts'
import { ADMIN } from './admin.ts'
import { CONFIG } from './config.ts'
import { LINK } from './links.ts'
import { MEM } from './memory.ts'
import { NOTE } from './notes.ts'
import { ROUTE } from './routing.ts'
import { ZONE } from './zones.ts'

export default {
  contract: 1,
  name: 'ki-kb',
  concern: 'Knowledge Islands knowledge bases',
  createSession: createKbSession,
  families: [ZONE, CONFIG, ADMIN, ROUTE, NOTE, MEM, LINK]
} satisfies SkillRubricDefinition<KbRubricContext>
