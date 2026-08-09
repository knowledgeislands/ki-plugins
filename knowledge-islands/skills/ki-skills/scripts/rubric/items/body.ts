import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { judgment } from '../../shared/rubric.ts'
import type { KiSkillsRubricContext } from '../contexts/contexts.ts'

const BODY_1: RubricItem<unknown> = {
  code: 'BODY-1',
  title: 'instruction freedom matches task fragility',
  description: 'Degrees of freedom match task fragility (prose → parameterised script → exact "do not modify").',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Does the level of instruction freedom match this task’s fragility?')
}

const BODY_2: RubricItem<unknown> = {
  code: 'BODY-2',
  title: 'the main body avoids time-sensitive content',
  description: 'No time-sensitive content in the main body; legacy goes in a collapsed note.',
  sources: ['BP'],
  judgment: judgment('Does the main body avoid time-sensitive content, containing legacy detail appropriately?')
}

const BODY_3: RubricItem<unknown> = {
  code: 'BODY-3',
  title: 'terminology is consistent',
  description: 'Consistent terminology — one term per concept.',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Does the skill use one consistent term for each concept?')
}

const BODY_4: RubricItem<unknown> = {
  code: 'BODY-4',
  title: 'style-sensitive output includes concrete examples',
  description: 'Concrete examples (2–3 I/O pairs) where output quality depends on style.',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Where output quality depends on style, are there concrete input and output examples?')
}

const BODY_5: RubricItem<unknown> = {
  code: 'BODY-5',
  title: 'one default approach has an escape hatch',
  description: 'One default approach with an escape hatch, not a menu.',
  sources: ['BP'],
  judgment: judgment('Does the skill give one default approach with a clear escape hatch rather than a menu?')
}

const BODY_6: RubricItem<unknown> = {
  code: 'BODY-6',
  title: 'template strictness matches its contract',
  description: 'Template strictness matches the contract (exact vs adapt).',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Does any template make its strictness appropriate and explicit?')
}

const BODY_7: RubricItem<unknown> = {
  code: 'BODY-7',
  title: 'multi-step work has a copyable checklist and feedback loop where needed',
  description: 'Copyable checklist for multi-step tasks; feedback loop for quality-critical ones.',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Does multi-step work provide a copyable checklist and, when quality-critical, a feedback loop?')
}

const BODY_8: RubricItem<unknown> = {
  code: 'BODY-8',
  title: 'rules state their rationale',
  description: 'Rules state the _why_ alongside the rule, not bare MUST/NEVER.',
  sources: ['COMMUNITY'],
  judgment: judgment('Do rules explain their rationale rather than stating bare MUST or NEVER directives?')
}

export const BODY: RubricFamily<KiSkillsRubricContext, KiSkillsRubricContext> = {
  code: 'BODY',
  title: 'Body content quality',
  description: 'The quality and usability of the skill instructions.',
  standard: 'standards-agent-skills.md#9-body-content-quality',
  selectContext: (context: KiSkillsRubricContext) => context,
  items: [BODY_1, BODY_2, BODY_3, BODY_4, BODY_5, BODY_6, BODY_7, BODY_8]
}
