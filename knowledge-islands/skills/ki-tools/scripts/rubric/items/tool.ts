import type { AuditOutcome, RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import type { ToolRepositoryContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'
const SOURCE = [STANDARD] as const
const one = (outcome: AuditOutcome): readonly AuditOutcome[] => [outcome]

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  run: (context: ToolRepositoryContext) => readonly AuditOutcome[]
): RubricItem<ToolRepositoryContext> => ({
  code,
  title,
  description,
  sources: SOURCE,
  mechanical: { level, audit: { phase: 'INSPECT', run } }
})

const judgment = (code: string, title: string, description: string): RubricItem<ToolRepositoryContext> => ({
  code,
  title,
  description,
  sources: SOURCE,
  judgment: { prompt: description }
})

const notApplicable = (context: ToolRepositoryContext): readonly AuditOutcome[] | null =>
  context.applicable ? null : one({ status: 'NOT_APPLICABLE', message: 'No [ki-tools] declaration or bin/ structural marker is present.' })

const TOOL_BIN = mechanical('TOOL-BIN', 'Tool executable', '`bin/` exists and holds at least one physical file.', 'FAIL', (context) => {
  if (context.rootState === 'absent')
    return one({ status: 'VIOLATION', message: 'Audit target does not exist.', subject: context.repository })
  if (context.rootState === 'unsafe')
    return one({ status: 'VIOLATION', message: 'Audit target is not a physical directory.', subject: context.repository })
  const skipped = notApplicable(context)
  if (skipped) return skipped
  if (context.binState === 'unsafe')
    return one({ status: 'VIOLATION', message: 'bin/ is not a physical readable directory.', subject: 'bin/' })
  if (context.binState === 'missing') return one({ status: 'VIOLATION', message: 'Tool executable directory is missing.', subject: 'bin/' })
  if (context.unsafeBinEntries.length > 0)
    return one({
      status: 'VIOLATION',
      message: `bin/ contains unsafe entries: ${context.unsafeBinEntries.join(', ')}.`,
      subject: 'bin/'
    })
  return context.bins.length > 0
    ? one({
        status: 'PASS',
        message: `Contains ${context.bins.length} executable candidate(s): ${context.bins.map((bin) => bin.name).join(', ')}.`,
        subject: 'bin/'
      })
    : one({ status: 'VIOLATION', message: 'No physical executable files were found.', subject: 'bin/' })
})

const TOOL_EXEC: RubricItem<ToolRepositoryContext> = {
  code: 'TOOL-EXEC',
  title: 'Executable bit',
  description: 'Every physical `bin/<file>` carries the executable bit.',
  sources: SOURCE,
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skipped = notApplicable(context)
        if (skipped) return skipped
        if (context.binState !== 'present' || context.bins.length === 0)
          return one({ status: 'NOT_APPLICABLE', message: 'No physical bin files are available for executable-bit inspection.' })
        const bad = context.bins.filter((bin) => !bin.executable)
        return bad.length > 0
          ? one({
              status: 'VIOLATION',
              message: `Missing executable bit (chmod +x): ${bad.map((bin) => bin.name).join(', ')}.`,
              subject: 'bin/'
            })
          : one({ status: 'PASS', message: 'Every physical bin/ file is executable.', subject: 'bin/' })
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: (context) => context.requestBinExecutables?.()
    }
  }
}

const TOOL_SCOPE = judgment('TOOL-SCOPE', 'One command', 'The repository contains genuinely one tool rather than distinct commands.')
const TOOL_XDG = judgment('TOOL-XDG', 'XDG storage', 'The tool follows the XDG Base Directory specification for config, state, and cache.')

const TOOL_INSTALL: RubricItem<ToolRepositoryContext> = {
  code: 'TOOL-INSTALL',
  title: 'Installer executable',
  description: '`install.sh` is a physical executable file.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skipped = notApplicable(context)
        if (skipped) return skipped
        if (context.install === 'unsafe')
          return one({ status: 'VIOLATION', message: 'install.sh is not a physical regular file.', subject: 'install.sh' })
        if (context.install === 'missing')
          return one({ status: 'VIOLATION', message: 'No install.sh exists at the repository root.', subject: 'install.sh' })
        return context.install === 'executable'
          ? one({ status: 'PASS', message: 'install.sh is present and executable.', subject: 'install.sh' })
          : one({ status: 'VIOLATION', message: 'install.sh lacks the executable bit.', subject: 'install.sh' })
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: (context) => context.requestInstallExecutable?.()
    }
  }
}

const TOOL_INSTALL_QUALITY = judgment(
  'TOOL-INSTALL-QUALITY',
  'Installer quality',
  'The installer is POSIX-ish, honours overrides, verifies downloads, and is idempotent.'
)

const TOOL_VERSION = mechanical(
  'TOOL-VERSION',
  'Version flag',
  'The primary executable contains `--version` handling.',
  'WARN',
  (context) => {
    const skipped = notApplicable(context)
    if (skipped) return skipped
    if (!context.primary) return one({ status: 'NOT_APPLICABLE', message: 'No primary executable is available.' })
    return context.primaryText.includes('--version')
      ? one({ status: 'PASS', message: 'Primary executable handles --version.', subject: `bin/${context.primary}` })
      : one({
          status: 'VIOLATION',
          message: 'Primary executable has no visible --version handling.',
          subject: `bin/${context.primary}`
        })
  }
)

const TOOL_VERSION_SOURCE = judgment(
  'TOOL-VERSION-SOURCE',
  'Version source',
  'The version marker has one source of truth aligned with the latest tag and changelog.'
)

const TOOL_CHANGELOG = mechanical(
  'TOOL-CHANGELOG',
  'Changelog presence',
  '`CHANGELOG.md` is a physical regular file.',
  'WARN',
  (context) => {
    const skipped = notApplicable(context)
    if (skipped) return skipped
    if (context.changelog === 'unsafe')
      return one({ status: 'VIOLATION', message: 'CHANGELOG.md is not a physical regular file.', subject: 'CHANGELOG.md' })
    return context.changelog === 'physical'
      ? one({ status: 'PASS', message: 'Release history file is present.', subject: 'CHANGELOG.md' })
      : one({ status: 'VIOLATION', message: 'Release history file is absent.', subject: 'CHANGELOG.md' })
  }
)

const TOOL_CHANGELOG_FORMAT = judgment(
  'TOOL-CHANGELOG-FORMAT',
  'Changelog format',
  'The changelog follows Keep a Changelog and semantic versioning.'
)

const TOOL_CI = mechanical('TOOL-CI', 'CI workflow', 'At least one physical workflow YAML file is present.', 'WARN', (context) => {
  const skipped = notApplicable(context)
  if (skipped) return skipped
  if (context.workflows === 'unsafe' || context.unsafeWorkflowEntries.length > 0)
    return one({
      status: 'VIOLATION',
      message: `Workflow evidence is unsafe or unreadable${
        context.unsafeWorkflowEntries.length > 0 ? `: ${context.unsafeWorkflowEntries.join(', ')}` : ''
      }.`,
      subject: '.github/workflows/'
    })
  return context.workflowFiles.length > 0
    ? one({ status: 'PASS', message: `${context.workflowFiles.length} CI workflow file(s) are present.`, subject: '.github/workflows/' })
    : one({ status: 'VIOLATION', message: 'No .github/workflows/*.yml workflow exists.', subject: '.github/workflows/' })
})

const TOOL_TAP = judgment('TOOL-TAP', 'Companion formula', 'A companion Homebrew formula exists in the governed tap.')

const TOOL_TESTS = mechanical('TOOL-TESTS', 'Test directory', 'A physical `tests/` directory is present.', 'WARN', (context) => {
  const skipped = notApplicable(context)
  if (skipped) return skipped
  if (context.tests === 'unsafe')
    return one({ status: 'VIOLATION', message: 'tests/ is not a physical readable directory.', subject: 'tests/' })
  return context.tests === 'present'
    ? one({ status: 'PASS', message: 'tests/ directory is present.', subject: 'tests/' })
    : one({ status: 'VIOLATION', message: 'tests/ directory is absent.', subject: 'tests/' })
})

const TOOL_ENGINEERING = judgment(
  'TOOL-ENGINEERING',
  'Engineering declaration',
  'A package.json-bearing repository declares ki-engineering.'
)
const TOOL_LANGUAGE = judgment(
  'TOOL-LANGUAGE',
  'Other-language toolchain',
  'A non-shell, non-JavaScript tool wires its own lint and test toolchain into CI.'
)
const TOOL_RELEASE_CHECK = judgment(
  'TOOL-RELEASE-CHECK',
  'Release alignment',
  'Version markers, tags, releases, and changelog entries agree.'
)

export const TOOL: RubricFamily<ToolsRubricContext, ToolRepositoryContext> = {
  code: 'TOOL',
  title: 'tool repository',
  description: 'Layout, executable, distribution, versioning, and judgment criteria.',
  standard: STANDARD,
  selectContext: (context) => context.tool,
  items: [
    TOOL_BIN,
    TOOL_EXEC,
    TOOL_SCOPE,
    TOOL_XDG,
    TOOL_INSTALL,
    TOOL_INSTALL_QUALITY,
    TOOL_VERSION,
    TOOL_VERSION_SOURCE,
    TOOL_CHANGELOG,
    TOOL_CHANGELOG_FORMAT,
    TOOL_CI,
    TOOL_TAP,
    TOOL_TESTS,
    TOOL_ENGINEERING,
    TOOL_LANGUAGE,
    TOOL_RELEASE_CHECK
  ]
}
