import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ChezmoiShapeContext } from '../contexts/chezmoi.ts'

const STANDARD = ['standards-chezmoi-dotfiles.md'] as const

const CHEZMOI_1: RubricItem<ChezmoiShapeContext> = {
  code: 'CHEZMOI-1',
  title: 'Managed ignore file',
  description: 'A physical `.chezmoiignore` exists at the repository root.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: ({ repository, repositoryState, ignoreState }) => {
        if (repositoryState === 'absent')
          return [{ status: 'VIOLATION', message: 'The audit target does not exist.', subject: repository }]
        if (repositoryState === 'unsafe')
          return [
            { status: 'VIOLATION', message: 'The audit target is not a physical directory.', subject: repository }
          ]
        if (ignoreState === 'physical')
          return [{ status: 'PASS', message: 'The managed ignore file is present.', subject: '.chezmoiignore' }]
        if (ignoreState === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: 'The managed ignore path is not a physical regular file and will not be replaced.',
              subject: '.chezmoiignore'
            }
          ]
        return [
          {
            status: 'VIOLATION',
            message: 'The managed ignore file is missing; CONFORM can explicitly create it.',
            subject: '.chezmoiignore'
          }
        ]
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: ({ requestIgnoreCreate }) => {
        requestIgnoreCreate?.()
      }
    }
  }
}

const CHEZMOI_2: RubricItem<ChezmoiShapeContext> = {
  code: 'CHEZMOI-2',
  title: 'Template support directory',
  description: 'When `*.tmpl` files exist, a physical `.chezmoidata/` or `.chezmoitemplates/` also exists.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Add the appropriate physical template-support directory after confirming which data or template responsibility the repository needs.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ repositoryState, hasTemplateFiles, hasTemplateSupport }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The target repository is not safely inspectable.' }]
        if (!hasTemplateFiles)
          return [
            { status: 'NOT_APPLICABLE', message: 'No template files exist, so support directories are not required.' }
          ]
        return hasTemplateSupport
          ? [{ status: 'PASS', message: 'Template support is present alongside template files.' }]
          : [
              {
                status: 'VIOLATION',
                message:
                  'Template files exist but neither .chezmoidata/ nor .chezmoitemplates/ is a physical directory.',
                subject: '.chezmoidata/ or .chezmoitemplates/'
              }
            ]
      }
    }
  }
}

const CHEZMOI_J1: RubricItem<ChezmoiShapeContext> = {
  code: 'CHEZMOI-J1',
  title: 'Chezmoiignore negation intent',
  description: 'A `.chezmoiignore` negation is deliberate and documented rather than accidentally broad.',
  sources: STANDARD,
  judgment: {
    scope: 'Every `.chezmoiignore` negation and the broad ignore it overrides.',
    prompt: 'Are `.chezmoiignore` negations deliberate, documented exceptions to broad ignores?',
    outcomes: ['conforming', 'documentation required', 'negation revision required'],
    guidance:
      'Document the intentional exception beside the negation, narrow or remove accidental patterns, and preserve only the intended managed path.'
  }
}

export const CHEZMOI: RubricFamily<ChezmoiRubricContext, ChezmoiShapeContext> = {
  code: 'CHEZMOI',
  title: 'Chezmoi repository shape',
  description: 'Required repository-shape files and template support.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.shape,
  items: [CHEZMOI_1, CHEZMOI_2, CHEZMOI_J1]
}
