import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type BindingChezMoiContext, createBindingChezMoiSession } from '../contexts/binding-chezmoi.ts'
import { BINDCHEZ } from './bindchez.ts'

export default {
  contract: 1,
  name: 'ki-binding-chezmoi',
  concern: 'Knowledge Islands chezmoi MCP rendering',
  createSession: createBindingChezMoiSession,
  families: [BINDCHEZ]
} satisfies SkillRubricDefinition<BindingChezMoiContext>
