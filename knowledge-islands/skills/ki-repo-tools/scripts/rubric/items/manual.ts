import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ManualToolsContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'
const one = (outcome: AuditOutcome): readonly AuditOutcome[] => [outcome]

const MAN_LINT: RubricItem<ManualToolsContext> = {
  code: 'MAN-LINT',
  title: 'Manual lint CI',
  description:
    'A physical man/<tool>.1 page has CI that runs mandoc -T lint, directly or through the native task runner.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the mandoc CI gate through the repository’s maintained release workflow.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable)
          return one({
            status: 'NOT_APPLICABLE',
            message: 'ki-repo-tools is not applicable: its repository declaration is absent.'
          })
        if (context.manual === 'missing')
          return one({ status: 'NOT_APPLICABLE', message: `No ${context.manualPath} source page is present.` })
        if (context.manual === 'unsafe')
          return one({
            status: 'VIOLATION',
            message: `${context.manualPath} is not a physical regular file.`,
            subject: context.manualPath
          })
        if (context.workflows === 'unsafe' || context.unsafeWorkflowEntries.length > 0)
          return one({
            status: 'VIOLATION',
            message: 'CI workflow evidence is unsafe or unreadable.',
            subject: '.github/workflows/'
          })
        const expected = `mandoc -T lint ${context.manualPath}`
        const direct = context.workflowText.includes(expected)
        const scripted =
          context.manualCommand === expected && /\bbun\s+run\s+ki:tools:lint-man\b/.test(context.workflowText)
        return direct || scripted
          ? one({ status: 'PASS', message: `A CI workflow runs ${expected}.`, subject: context.manualPath })
          : one({
              status: 'VIOLATION',
              message: `${context.manualPath} has no CI gate that runs ${expected}.`,
              subject: context.manualPath
            })
      }
    }
  }
}

const MAN_INSTALL = {
  code: 'MAN-INSTALL',
  title: 'Manual distribution',
  description:
    'A shipped physical man page is installed by the release installer and linked with the executable by its --link mode.',
  sources: [STANDARD],
  judgment: {
    scope: 'The shipped manual page, release installer, and executable link mode.',
    prompt:
      'A shipped physical man page is installed by the release installer and linked with the executable by its --link mode.',
    outcomes: ['conforming', 'installer revision required', 'distribution decision required'],
    guidance:
      'Align the installer and link behaviour with the shipped manual, or record the release-distribution decision that changes the supported path.'
  }
} satisfies RubricItem<ManualToolsContext>

const MAN_SURFACE = {
  code: 'MAN-SURFACE',
  title: 'Manual command surface',
  description:
    'A physical manual stays aligned with CLI help and uses the tool’s command-group vocabulary in its SYNOPSIS.',
  sources: [STANDARD],
  judgment: {
    scope: 'The physical manual, CLI help, and documented command-group vocabulary.',
    prompt:
      'A physical manual stays aligned with CLI help and uses the tool’s command-group vocabulary in its SYNOPSIS.',
    outcomes: ['conforming', 'manual revision required', 'CLI vocabulary decision required'],
    guidance:
      'Revise the manual or CLI help so the SYNOPSIS and command vocabulary agree, or record the governing vocabulary decision.'
  }
} satisfies RubricItem<ManualToolsContext>

const MAN_GUIDANCE = {
  code: 'MAN-GUIDANCE',
  title: 'Manual installation and completion guidance',
  description:
    'A physical manual documents the supported release and local-development installation paths, including manual installation or linking, and identifies the canonical completion action without assigning shell-startup mutation to the tool installer.',
  sources: [STANDARD],
  judgment: {
    scope: 'The physical manual’s installation and completion guidance.',
    prompt:
      'A physical manual documents the supported release and local-development installation paths, including manual installation or linking, and identifies the canonical completion action without assigning shell-startup mutation to the tool installer.',
    outcomes: ['conforming', 'guidance revision required', 'ownership decision required'],
    guidance:
      'Update the manual’s supported installation and completion guidance while retaining the shell-startup ownership boundary.'
  }
} satisfies RubricItem<ManualToolsContext>

const MAN_STYLE = {
  code: 'MAN-STYLE',
  title: 'Manual source and layout',
  description:
    'A physical manual uses portable roff macros, documents each configuration format canonically in FILES, uses a literal \\& after each .SH / .SS followed by .PP before prose or a structural macro, and receives a rendered-spacing inspection after mandoc lint.',
  sources: [STANDARD],
  judgment: {
    scope: 'The physical manual source, its roff macros, FILES section, and rendered spacing inspection.',
    prompt:
      'A physical manual uses portable roff macros, documents each configuration format canonically in FILES, uses a literal \\& after each .SH / .SS followed by .PP before prose or a structural macro, and receives a rendered-spacing inspection after mandoc lint.',
    outcomes: ['conforming', 'manual layout revision required', 'rendered inspection required'],
    guidance:
      'Correct the roff source and FILES documentation, then inspect rendered spacing in addition to passing mandoc lint.'
  }
} satisfies RubricItem<ManualToolsContext>

export const MAN: RubricFamily<ToolsRubricContext, ManualToolsContext> = {
  code: 'MAN',
  title: 'manual capabilities',
  description: 'Man-page linting requirements.',
  standard: STANDARD,
  selectContext: (context) => context.manual,
  items: [MAN_LINT, MAN_INSTALL, MAN_SURFACE, MAN_GUIDANCE, MAN_STYLE]
}
