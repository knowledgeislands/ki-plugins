import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbNoteContext, KbRubricContext } from '../contexts/kb.ts'

const FRONTMATTER = 'standards-frontmatter.md'
const KB = 'standards-knowledge-base.md'

const NOTE_1: RubricItem<KbNoteContext> = {
  code: 'NOTE-1',
  title: 'declared required frontmatter',
  description:
    'When required_frontmatter is declared, each note with frontmatter carries those keys; otherwise key requirements remain a judgment call.',
  sources: [FRONTMATTER, KB],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.requiredFrontmatter }
  },
  judgment: {
    prompt: 'When no required_frontmatter list is declared, are the required keys appropriate to this base and its host guidance?'
  }
}

const NOTE_1A: RubricItem<KbNoteContext> = {
  code: 'NOTE-1a',
  title: 'well-formed frontmatter fences',
  description: 'Every opening frontmatter fence closes.',
  sources: [FRONTMATTER],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.frontmatterFences }
  }
}

const NOTE_1B: RubricItem<KbNoteContext> = {
  code: 'NOTE-1b',
  title: 'snake_case frontmatter keys',
  description: 'Top-level frontmatter keys use snake_case.',
  sources: [FRONTMATTER],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.frontmatterKeys }
  }
}

const NOTE_2: RubricItem<KbNoteContext> = {
  code: 'NOTE-2',
  title: 'note naming convention',
  description: 'Calendar notes are dated and other note names follow the base convention.',
  sources: [KB],
  judgment: { prompt: 'Do note names follow the base-specific naming convention?' }
}

const NOTE_3: RubricItem<KbNoteContext> = {
  code: 'NOTE-3',
  title: 'source and analysis distinction',
  description: 'Facts are cited to a source path or reference, and analysis is labelled where the base distinguishes it.',
  sources: [KB],
  judgment: { prompt: 'Are facts sourced and analysis labelled according to the base convention?' }
}

export const NOTE: RubricFamily<KbRubricContext, KbNoteContext> = {
  code: 'NOTE',
  title: 'note conventions',
  description: 'Frontmatter mechanics and note-authoring judgment.',
  standard: FRONTMATTER,
  selectContext: (context) => context.notes,
  items: [NOTE_1, NOTE_1A, NOTE_1B, NOTE_2, NOTE_3]
}
