import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ChezmoiRubricContext, createChezmoiSession } from '../contexts/chezmoi.ts'
import { BIN } from './bin.ts'
import { CHEZMOI } from './chezmoi.ts'
import { CONFIG } from './config.ts'
import { ETIQ } from './etiquette.ts'
import { GIT } from './git.ts'
import { LAYER } from './layer.ts'
import { PATTERN } from './pattern.ts'
import { SYNC } from './sync.ts'

export default {
  contract: 1,
  name: 'ki-dotfiles-chezmoi',
  concern: 'Knowledge Islands chezmoi dotfiles management',
  createSession: createChezmoiSession,
  families: [CHEZMOI, BIN, GIT, PATTERN, CONFIG, LAYER, ETIQ, SYNC]
} satisfies SkillRubricDefinition<ChezmoiRubricContext>
