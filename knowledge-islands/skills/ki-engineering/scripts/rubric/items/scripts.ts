import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type EngineeringEvidence,
  type EngineeringRubricContext,
  type ScriptsRubricContext
} from '../contexts/engineering.ts'

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: ScriptsRubricContext) => EngineeringEvidence,
  options: { overrideLevels?: readonly ViolationLevel[]; conform?: boolean } = {}
): RubricItem<ScriptsRubricContext> => {
  const base = { code, title, description, sources: ['standards-engineering.md'] as const }
  const shared = {
    level,
    ...(options.overrideLevels ? { overrideLevels: options.overrideLevels } : {}),
    audit: {
      phase: 'INSPECT' as const,
      run: (context: ScriptsRubricContext) => auditEvidence(evidence(context), level, options.overrideLevels)
    }
  }
  return options.conform
    ? {
        ...base,
        mechanical: {
          ...shared,
          remediation: { class: 'automatic' },
          conform: { phase: 'PRIMARY', run: (context) => context.synchronisePackage?.() }
        }
      }
    : {
        ...base,
        mechanical: {
          ...shared,
          remediation: {
            class: 'diagnostic',
            guidance: 'Revise the package scripts to meet the governed script surface, then rerun the audit.'
          }
        }
      }
}

const judgment = (
  code: string,
  title: string,
  description: string,
  scope: string,
  prompt: string,
  guidance: string
): RubricItem<ScriptsRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  judgment: { scope, prompt, outcomes: ['conforming', 'gap', 'exclusion'], guidance }
})

export const SCRIPTS: RubricFamily<EngineeringRubricContext, ScriptsRubricContext> = {
  code: 'SCR',
  title: 'Package scripts',
  description: 'The direct CLI boundary, lifecycle idioms, and clean cutover discipline.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.scripts,
  items: [
    mechanical(
      'SCR-1',
      'KI script naming law',
      'Every script is a permitted bare lifecycle idiom or carries the `ki:` prefix; a bare non-idiom name is drift.',
      'FAIL',
      (context) => context.scr1
    ),
    mechanical(
      'SCR-2',
      'Repository maintenance stays CLI-owned',
      'Package scripts do not invoke `ki repo audit`, `ki repo conform`, or `ki repo educate`, whether for the whole repository or a focused skill; repositories invoke the installed CLI directly.',
      'FAIL',
      (context) => context.scr2,
      { conform: true }
    ),
    mechanical(
      'SCR-3',
      'Retired script families absent',
      'Every `ki:` script belongs to a declared owning capability and `ki:deps:update` is present; retired tool families and aggregate governance aliases are absent.',
      'FAIL',
      (context) => context.scr3,
      { conform: true }
    ),
    mechanical(
      'SCR-4',
      'Per-skill wrapper aliases absent',
      'Package scripts contain no derived `ki:<skill>:<mode>` aliases and no command that invokes `.ki`, `govern.ts`, `educate.ts`, an adapter, or a vendored runtime.',
      'FAIL',
      (context) => context.scr4,
      { conform: true }
    ),
    mechanical(
      'SCR-5',
      'Lifecycle clean and prepare scripts',
      '`clean` removes `node_modules` (and `dist` where built), and `prepare` is `husky`.',
      'FAIL',
      (context) => context.scr5,
      { overrideLevels: ['WARN'], conform: true }
    ),
    mechanical(
      'SCR-6',
      'No test-entrypoint bypass',
      'Only the bare `test` script may use `bun test`; every other script uses `bun run test` to invoke the governed entrypoint.',
      'FAIL',
      (context) => context.scr6
    ),
    mechanical(
      'SCR-7',
      'Runner-neutral test and build entrypoints',
      'Test-capable repos expose bare `test`; compiled repos expose bare `build`; repository governance remains outside package scripts.',
      'FAIL',
      (context) => context.scr7
    ),
    judgment(
      'SCR-8',
      'Repo-specific scripts retain clear ownership',
      'Repo-specific scripts beyond the governance surface are valid only when an owning skill governs them and they do not shadow a governed entrypoint.',
      'Every repo-specific script outside the governed lifecycle and `ki:` surface.',
      'Do repo-specific scripts have a clear owner and avoid divergent shadows of governed entrypoints?',
      'Assign the script to an owning capability, remove a divergent shadow, record a named Gap, or record an explicit exclusion.'
    ),
    judgment(
      'SCR-9',
      'Clean-end-state cutovers',
      'Repository-footprint replacements cut directly to the intended contract, remove the superseded implementation, and verify the result without compatibility code that exists only for an intermediate state.',
      'Every current or recently completed repository-footprint replacement.',
      'Did the cutover reach and verify the correct clean end state without retaining transitional compatibility code?',
      'Complete the clean cutover, record a named Gap with its owner, or record an explicit exclusion.'
    )
  ]
}
