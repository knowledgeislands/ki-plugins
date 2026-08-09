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
    remediation: { class: 'diagnostic', guidance: 'Add the declared required frontmatter keys, then rerun the audit.' },
    audit: { phase: 'INSPECT', run: (context) => context.requiredFrontmatter }
  },
  judgment: {
    scope: 'The base frontmatter convention and its host guidance.',
    prompt:
      'When no required_frontmatter list is declared, are the required keys appropriate to this base and its host guidance?',
    outcomes: ['conforming', 'convention revision', 'not applicable'],
    guidance: 'Set required keys through the base owner’s convention; do not infer them from a mechanical finding.'
  }
}

const NOTE_1A: RubricItem<KbNoteContext> = {
  code: 'NOTE-1a',
  title: 'well-formed frontmatter fences',
  description: 'Every opening frontmatter fence closes.',
  sources: [FRONTMATTER],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'diagnostic', guidance: 'Close the affected frontmatter fence, then rerun the audit.' },
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
    remediation: {
      class: 'diagnostic',
      guidance: 'Rename affected top-level frontmatter keys to snake_case, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.frontmatterKeys }
  }
}

const NOTE_2: RubricItem<KbNoteContext> = {
  code: 'NOTE-2',
  title: 'note naming convention',
  description: 'Calendar notes are dated and other note names follow the base convention.',
  sources: [KB],
  judgment: {
    scope: 'Sampled notes and the base naming convention.',
    prompt: 'Do note names follow the base-specific naming convention?',
    outcomes: ['conforming', 'rename note', 'convention revision'],
    guidance: 'Apply the base owner’s naming convention without inventing a new taxonomy.'
  }
}

const NOTE_3: RubricItem<KbNoteContext> = {
  code: 'NOTE-3',
  title: 'source and analysis distinction',
  description:
    'Facts are cited to a source path or reference, and analysis is labelled where the base distinguishes it.',
  sources: [KB],
  judgment: {
    scope: 'Sampled factual and analytical note content and the base convention.',
    prompt: 'Are facts sourced and analysis labelled according to the base convention?',
    outcomes: ['conforming', 'note revision', 'convention revision'],
    guidance: 'Add evidence or labels according to the base convention; do not manufacture sources.'
  }
}

export const NOTE: RubricFamily<KbRubricContext, KbNoteContext> = {
  code: 'NOTE',
  title: 'note conventions',
  description: 'Frontmatter mechanics and note-authoring judgment.',
  standard: FRONTMATTER,
  selectContext: (context) => context.notes,
  items: [NOTE_1, NOTE_1A, NOTE_1B, NOTE_2, NOTE_3]
}
