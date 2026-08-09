import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { BindingChezMoiContext } from '../contexts/binding-chezmoi.ts'

const STANDARD = ['standards-chezmoi-mcp-rendering.md'] as const

const BINDCHEZ_1: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-1',
  title: 'Chezmoi source repository is inspectable',
  description:
    'The explicitly targeted chezmoi source repository is a physical directory that can supply render evidence.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Select a safe chezmoi source repository or remove unsafe evidence before re-running the audit.'
    },
    audit: {
      phase: 'PREPARE',
      run: ({ repository, repositoryState, unsafePaths }) => {
        if (repositoryState === 'absent')
          return [
            {
              status: 'VIOLATION',
              message: 'The targeted chezmoi source repository does not exist.',
              subject: repository
            }
          ]
        if (repositoryState === 'unsafe')
          return [
            {
              status: 'VIOLATION',
              message: 'The targeted chezmoi source repository is not a physical directory.',
              subject: repository
            }
          ]
        return unsafePaths.length
          ? unsafePaths.map((path) => ({
              status: 'VIOLATION' as const,
              message: 'Symlinked or non-regular render evidence is not inspected.',
              subject: path
            }))
          : [{ status: 'PASS', message: 'The chezmoi source repository is safely inspectable.', subject: repository }]
      }
    }
  }
}

const BINDCHEZ_2: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-2',
  title: 'Surface agreement remains renderer-neutral',
  description:
    'The renderer-neutral ki-binding audit, composed separately, remains the authority for rendered surface agreement.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Run the preceding ki-binding audit; its renderer-neutral findings own surface agreement.'
    },
    audit: {
      phase: 'DERIVED',
      run: () => [
        {
          status: 'NOT_APPLICABLE',
          message: 'Surface agreement is owned by ki-binding; run its audit as the preceding composition step.'
        }
      ]
    }
  }
}

const BINDCHEZ_3: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-3',
  title: 'MCP source data is present',
  description:
    'The chezmoi repository carries MCP source data through either supported, explicitly chosen render pattern.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the explicitly chosen MCP data pattern through the repository owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ repositoryState, data }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The chezmoi source repository is not safely inspectable.' }]
        if (!data.length)
          return [
            {
              status: 'VIOLATION',
              message: 'No MCP source data was found in either supported render pattern.'
            }
          ]
        return data.map((entry) => ({
          status: 'PASS' as const,
          message: `MCP source data uses the ${entry.pattern} pattern.`,
          subject: entry.path
        }))
      }
    }
  }
}

const BINDCHEZ_4: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-4',
  title: 'Render template is present',
  description: 'An mcp-servers-json render template partial exists in the chezmoi source repository.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: { class: 'diagnostic', guidance: 'Add or correct the render partial through the repository owner.' },
    audit: {
      phase: 'INSPECT',
      run: ({ repositoryState, templates }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The chezmoi source repository is not safely inspectable.' }]
        return templates.length
          ? templates.map((path) => ({
              status: 'PASS' as const,
              message: 'The render template is present.',
              subject: path
            }))
          : [{ status: 'VIOLATION', message: 'No mcp-servers-json render template was found.' }]
      }
    }
  }
}

const BINDCHEZ_5: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-5',
  title: 'Render template is wired',
  description: 'At least one surface target template references the mcp-servers-json partial.',
  sources: STANDARD,
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Wire the render partial into an intended surface target through the repository owner.'
    },
    audit: {
      phase: 'DERIVED',
      run: ({ repositoryState, wiredTargets }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The chezmoi source repository is not safely inspectable.' }]
        return wiredTargets.length
          ? wiredTargets.map((path) => ({
              status: 'PASS' as const,
              message: 'A surface target references the render template.',
              subject: path
            }))
          : [{ status: 'VIOLATION', message: 'No surface target template references mcp-servers-json.' }]
      }
    }
  }
}

const BINDCHEZ_6: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-6',
  title: 'Render parity',
  description: 'A previewed chezmoi apply reproduces the surfaces that ki-binding audits.',
  sources: STANDARD,
  judgment: {
    scope: 'The reviewed chezmoi preview and the intended renderer-neutral surface state.',
    prompt: 'Does a reviewed chezmoi diff reproduce exactly the intended renderer-neutral surface state?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Revise the source data or templates through the responsible owner, record a named gap, or record an explicit justified exclusion.'
  }
}

const BINDCHEZ_7: RubricItem<BindingChezMoiContext> = {
  code: 'BINDCHEZ-7',
  title: 'Contract coherence',
  description: 'The render standard, structured rubric, provenance, and sibling ownership boundaries remain coherent.',
  sources: STANDARD,
  judgment: {
    scope: 'The render standard, structured rubric, source list, and sibling composition instructions.',
    prompt:
      'Do the standard, rubric, sources, and composition instructions describe the same render contract without duplicating sibling policy?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Reconcile the authoritative documents with their owners, record a named gap, or record an explicit justified exclusion.'
  }
}

export const BINDCHEZ: RubricFamily<BindingChezMoiContext, BindingChezMoiContext> = {
  code: 'BINDCHEZ',
  title: 'Chezmoi binding render path',
  description:
    'The renderer-specific delta connecting MCP source data, a chezmoi partial, and rendered surface targets.',
  standard: 'standards-chezmoi-mcp-rendering.md',
  selectContext: (context) => context,
  items: [BINDCHEZ_1, BINDCHEZ_2, BINDCHEZ_3, BINDCHEZ_4, BINDCHEZ_5, BINDCHEZ_6, BINDCHEZ_7]
}
