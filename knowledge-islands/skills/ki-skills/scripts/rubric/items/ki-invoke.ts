import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KiSkillsRubricContext } from '../contexts/contexts.ts'

const KI_INVOKE_1: RubricItem<unknown> = {
  code: 'KI-INVOKE-1',
  title: 'HELP is the safe bare-invocation default',
  description:
    '_HELP is the bare-invocation default; explicit `help` is pure explain._ Every mode-bearing skill exposes the universal **HELP** mode (ADR-KI-HARNESS-SKILLS-001). Invoked as `help` / `-h` / `?`, the skill **must** emit the generated HELP block (name, one-line purpose, invocation, mode list, off-ramps) and **stop** — no prompt, no action (the headless-safe form). Invoked with **no recognisable mode** and no clear context signal, it **must** emit the same HELP explanation, then — only in an interactive session — issue `AskUserQuestion` listing each mode with a one-line description, prompting for any `<target>` the chosen mode\'s `argument-hint` shows before starting work. Rationale: the caller learns what the skill _is_ before being asked which mode to run, and a cold/headless caller gets the explanation without a dead prompt. The one-liner "Infer the mode from the request; ask if unclear" is insufficient.',
  sources: ['COMMUNITY', 'ADR-KI-HARNESS-SKILLS-001'],
  judgment: {
    prompt:
      'Does explicit help stop after a generated HELP explanation, while an unclear interactive invocation explains the skill before asking for a mode?'
  }
}

export const KI_INVOKE: RubricFamily<KiSkillsRubricContext, KiSkillsRubricContext> = {
  code: 'KI-INVOKE',
  title: 'Invocation protocol',
  description: 'Safe invocation for a skill with named modes.',
  standard: '../../../../docs/decisions/ADR-KI-HARNESS-SKILLS-001-audit-conform-educate-refresh-canonical-modes-help.md',
  selectContext: (context: KiSkillsRubricContext) => context,
  items: [KI_INVOKE_1]
}
