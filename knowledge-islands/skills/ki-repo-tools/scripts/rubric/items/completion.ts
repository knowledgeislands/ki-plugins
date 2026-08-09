import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ToolRepositoryContext, ToolsRubricContext } from '../contexts/tools.ts'

const STANDARD = 'standards-tool-repositories.md'

const COMPLETION_SURFACE = {
  code: 'COMP-SURFACE',
  title: 'Completion command surface',
  description:
    'The CLI exposes exactly one documented completion <shell> action at a stable command path; it accepts bash and zsh, prints only the selected definition to standard output, and rejects unsupported shells as owned invalid syntax.',
  sources: [STANDARD],
  judgment: {
    scope: 'The CLI completion command, its supported shells, output, and invalid-input behaviour.',
    prompt:
      'The CLI exposes exactly one documented completion <shell> action at a stable command path; it accepts bash and zsh, prints only the selected definition to standard output, and rejects unsupported shells as owned invalid syntax.',
    outcomes: ['conforming', 'surface revision required', 'compatibility decision required'],
    guidance:
      'Revise the documented completion surface and its validation tests, or record the owning compatibility decision before changing command behaviour.'
  }
} satisfies RubricItem<ToolRepositoryContext>

const COMPLETION_INTEGRATION = {
  code: 'COMP-INTEGRATION',
  title: 'Completion integration',
  description:
    'The Bash definition registers the executable with complete; the Zsh definition is an autoloadable _<tool> artifact with #compdef and compdef registration that does not invoke itself while loading. Tests cover both emitted forms and Zsh registration under compinit.',
  sources: [STANDARD],
  judgment: {
    scope: 'The emitted Bash and Zsh completion definitions and their integration tests.',
    prompt:
      'The Bash definition registers the executable with complete; the Zsh definition is an autoloadable _<tool> artifact with #compdef and compdef registration that does not invoke itself while loading. Tests cover both emitted forms and Zsh registration under compinit.',
    outcomes: ['conforming', 'definition revision required', 'test evidence required'],
    guidance:
      'Correct the emitted definition and add or update the shell integration evidence without changing user persistence ownership.'
  }
} satisfies RubricItem<ToolRepositoryContext>

const COMPLETION_OWNERSHIP = {
  code: 'COMP-OWNERSHIP',
  title: 'Completion persistence ownership',
  description:
    'The tool does not edit shell startup files or personal completion directories. A shell configuration, package manager, or configuration manager persists the generated artifact and arranges fpath before compinit for Zsh.',
  sources: [STANDARD],
  judgment: {
    scope: 'The tool installer and the shell, package-manager, or configuration-manager persistence boundary.',
    prompt:
      'The tool does not edit shell startup files or personal completion directories. A shell configuration, package manager, or configuration manager persists the generated artifact and arranges fpath before compinit for Zsh.',
    outcomes: ['conforming', 'ownership correction required', 'integration decision required'],
    guidance:
      'Keep persistent shell configuration outside the tool installer and route any integration change to its owning shell or configuration layer.'
  }
} satisfies RubricItem<ToolRepositoryContext>

export const COMPLETION: RubricFamily<ToolsRubricContext, ToolRepositoryContext> = {
  code: 'COMP',
  title: 'completion capabilities',
  description: 'Portable Bash and Zsh completion output, integration, and ownership.',
  standard: STANDARD,
  selectContext: (context) => context.tool,
  items: [COMPLETION_SURFACE, COMPLETION_INTEGRATION, COMPLETION_OWNERSHIP]
}
