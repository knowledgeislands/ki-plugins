import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, type ScriptsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const SCRIPT_1: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-1',
  title: 'scripts handle expected errors',
  description: 'Scripts handle expected errors (missing file, permissions) rather than punt to the agent.',
  sources: ['BP'],
  judgment: { prompt: 'Do scripts handle expected errors rather than punting them to an agent?' }
}

const SCRIPT_2: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-2',
  title: 'scripts explain configuration values',
  description: 'No unexplained magic numbers — every config value is justified.',
  sources: ['BP'],
  judgment: { prompt: 'Are configuration values justified rather than unexplained magic numbers?' }
}

const SCRIPT_3: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-3',
  title: 'runtime dependencies and MCP tools are explicit',
  description: 'Required packages are listed/verified for the runtime; MCP tools use fully-qualified `ServerName:tool_name`.',
  sources: ['BP'],
  judgment: { prompt: 'Are runtime dependencies verified and MCP tools fully qualified?' }
}

const SCRIPT_4: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-4',
  title: 'deterministic reusable logic is pre-written',
  description: 'Deterministic, frequently-reused logic is pre-written, not regenerated each run.',
  sources: ['BP'],
  judgment: { prompt: 'Is deterministic, frequently reused logic pre-written rather than regenerated each run?' }
}

const SCRIPT_5: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-5',
  title: 'validation errors are actionable',
  description: 'Validation scripts are verbose — errors name the problem and the valid options.',
  sources: ['BP'],
  judgment: { prompt: 'Do validation errors name the problem and valid options?' }
}

const SCRIPT_6: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-6',
  title: 'batch and destructive work is planned and validated first',
  description: 'Plan-validate-execute for batch/destructive ops.',
  sources: ['BP', 'COMMUNITY'],
  judgment: { prompt: 'Do batch or destructive operations plan and validate before execution?' }
}

const SCRIPT_7: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-7',
  title: 'target-repository scripts are copied',
  description:
    "Scripts installed into a target repo's `scripts/` directory are **copies**, not symlinks or out-of-repo references — the target repo must be autonomous.",
  sources: ['BP'],
  judgment: { prompt: 'Are target-repository scripts copied rather than symlinked or referenced outside the repository?' }
}

const SCRIPT_8: RubricItem<ScriptsRubricContext> = {
  code: 'SCRIPT-8',
  title: 'top-level scripts are necessary public commands',
  description:
    'Every supported non-test script directly under `scripts/` is a necessary public command whose capability sits outside governed rubric execution. It exits successfully for `-h` and `--help`, prints useful usage, handles expected errors, and has focused tests. Private implementation belongs under `scripts/internal/`; published or materialised compile-time modules belong under `scripts/shared/`; rubric behaviour belongs under `scripts/rubric/`; generic execution belongs to `ki`.',
  sources: ['AS', 'KI'],
  mechanical: {
    level: 'FAIL',
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: ({ helpEvidence }) => {
        if (helpEvidence.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'the skill has no top-level scripts' }]
        const violations = helpEvidence
          .filter(
            ({ declaresShortHelp, declaresLongHelp, declaresUsageText }) => !declaresShortHelp || !declaresLongHelp || !declaresUsageText
          )
          .map(({ subject }) => ({
            status: 'VIOLATION' as const,
            message: 'source must declare `-h`, `--help`, and useful `Usage:` text',
            subject
          }))
        return violations.length > 0
          ? [violations[0] as (typeof violations)[number], ...violations.slice(1)]
          : [{ status: 'PASS', message: 'top-level scripts expose command help' }]
      }
    }
  },
  judgment: {
    prompt:
      'Is each top-level script still a necessary, tested public command at the correct ownership boundary, with useful help and expected-error handling?'
  }
}

export const SCRIPTS: RubricFamily<KiSkillsRubricContext, ScriptsRubricContext> = {
  code: 'SCRIPT',
  title: 'Scripts & executable code',
  description: 'The quality and autonomy of executable skill support.',
  standard: 'standards-agent-skills.md#10-scripts',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'scripts'),
  items: [SCRIPT_1, SCRIPT_2, SCRIPT_3, SCRIPT_4, SCRIPT_5, SCRIPT_6, SCRIPT_7, SCRIPT_8]
}
