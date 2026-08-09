import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessLayoutContext, HarnessRubricContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md'] as const

const rootUnavailable = (context: HarnessLayoutContext): readonly AuditOutcome[] | null => {
  if (context.repositoryState === 'absent')
    return [{ status: 'VIOLATION', message: 'The harness root does not exist.', subject: context.repository }]
  if (context.repositoryState === 'unsafe')
    return [
      { status: 'VIOLATION', message: 'The harness root is not a physical directory.', subject: context.repository }
    ]
  return null
}

const LAY_1: RubricItem<HarnessLayoutContext> = {
  code: 'LAY-1',
  title: 'Five-part directory layout',
  description:
    'skills/, subagents/, mcp/, evals/, and hooks/ all exist as physical directories at the source-harness root.',
  sources: ['standards-compatible-harness.md#source-harness-layout'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Create or repair the missing physical source-harness shelf, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        rootUnavailable(context) ??
        context.parts.map(({ name, state }) => ({
          status: state === 'directory' ? ('PASS' as const) : ('VIOLATION' as const),
          message:
            state === 'directory'
              ? 'Required source-harness directory is present.'
              : 'Required source-harness path is absent or not a physical directory.',
          subject: `${name}/`
        }))
    }
  }
}

const LAY_2: RubricItem<HarnessLayoutContext> = {
  code: 'LAY-2',
  title: 'Shelf descriptions',
  description: 'Each five-part source directory contains a physical README.md declaring its purpose and status.',
  sources: ['standards-compatible-harness.md#source-harness-layout'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the missing physical shelf README with its purpose and status, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        rootUnavailable(context) ??
        context.parts.map(({ name, state, readmeState }) => ({
          status:
            state !== 'directory'
              ? ('NOT_APPLICABLE' as const)
              : readmeState === 'file'
                ? ('PASS' as const)
                : ('VIOLATION' as const),
          message:
            state !== 'directory'
              ? 'The source-harness shelf is absent or unsafe.'
              : readmeState === 'file'
                ? 'Required shelf description is present.'
                : 'The shelf README is absent or not a physical regular file.',
          subject: `${name}/README.md`
        }))
    }
  }
}

const rootFileItem = (
  code: string,
  title: string,
  description: string,
  path: keyof HarnessLayoutContext['rootFiles'],
  level: 'FAIL' | 'WARN',
  source: string
): RubricItem<HarnessLayoutContext> => ({
  code,
  title,
  description,
  sources: [source],
  mechanical: {
    level,
    remediation: {
      class: 'diagnostic',
      guidance: 'Create or repair the required physical root file with owner-approved content, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const unavailable = rootUnavailable(context)
        if (unavailable) return unavailable
        return [
          context.rootFiles[path] === 'file'
            ? { status: 'PASS', message: 'Required physical root file is present.', subject: path }
            : { status: 'VIOLATION', message: 'Required root file is absent or unsafe.', subject: path }
        ]
      }
    }
  }
})

const LAY_3 = rootFileItem(
  'LAY-3',
  'Root Claude orientation',
  'CLAUDE.md exists as a physical file at the source-harness root.',
  'CLAUDE.md',
  'FAIL',
  'standards-compatible-harness.md#root-orientation'
)

const LAY_4 = rootFileItem(
  'LAY-4',
  'Root roadmap',
  'ROADMAP.md exists as a physical file at the source-harness root.',
  'ROADMAP.md',
  'WARN',
  'standards-compatible-harness.md#root-roadmap'
)

const LAY_5 = rootFileItem(
  'LAY-5',
  'Root Knowledge Islands configuration',
  '.ki-config.toml exists as a physical file at the source-harness root.',
  '.ki-config.toml',
  'FAIL',
  'standards-compatible-harness.md#harness-declaration'
)

export const LAY: RubricFamily<HarnessRubricContext, HarnessLayoutContext> = {
  code: 'LAY',
  title: 'Source-harness layout and files',
  description: 'The five-part source container and its required physical root files.',
  standard: STANDARD[0],
  selectContext: (context) => context.layout,
  items: [LAY_1, LAY_2, LAY_3, LAY_4, LAY_5]
}
