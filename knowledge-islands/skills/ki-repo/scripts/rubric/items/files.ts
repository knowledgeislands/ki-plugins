import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type FilesRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'
const CONFIGURATION_SOURCE = 'standards-configuration.md'

const FILES_1: RubricItem<FilesRubricContext> = {
  code: 'FILES-1',
  title: 'Required repository files',
  description:
    'README, license, gitignore, editor configuration, Claude orientation, and the exact ki-repo config marker are present in the selected evidence source.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files1, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureRepoConfiguration?.()
      }
    }
  }
}

const FILES_3: RubricItem<FilesRubricContext> = {
  code: 'FILES-3',
  title: 'Authoring baseline',
  description: 'A governed repository declares ki-authoring explicitly.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files3, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureAuthoringConfiguration?.()
      }
    }
  }
}

const FILES_4: RubricItem<FilesRubricContext> = {
  code: 'FILES-4',
  title: 'Runtime skill ignore contract',
  description:
    'Generated skill links are ignored for each declared runtime, while a repository-local .agents/skills/ki-self source remains committed.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files4, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureManagedGitignore?.()
      }
    }
  }
}

const FILES_5: RubricItem<FilesRubricContext> = {
  code: 'FILES-5',
  title: 'Configuration conformance header',
  description:
    'The root .ki.toml opens with the exact lightweight declaration that identifies it as Knowledge Islands repository configuration and explains that its presence declares conformance.',
  sources: [CONFIGURATION_SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files5, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureConfigurationHeader?.()
      }
    }
  }
}

const FILES_6: RubricItem<FilesRubricContext> = {
  code: 'FILES-6',
  title: 'Compositional ignore contract',
  description:
    'Root .gitignore contains dependency-stable, marker-bounded blocks owned by declared skills and a terminal unmanaged section.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files6, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureManagedGitignore?.()
      }
    }
  }
}

const FILES_7: RubricItem<FilesRubricContext> = {
  code: 'FILES-7',
  title: 'Unmanaged ignore inventory',
  description:
    'Repository-specific ignore rules remain visible below the terminal unmanaged header for later fleet reconciliation.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Review recurring unmanaged rules across the fleet and assign only genuinely portable rules to a skill.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files7, 'WARN') }
  }
}

const FILES_8: RubricItem<FilesRubricContext> = {
  code: 'FILES-8',
  title: 'Legacy .ki output absent',
  description:
    'The retired .ki output tree is absent; audit exposes any return and conform removes only proven untracked audits/conform output.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files8, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.removeLegacyKiOutput?.()
      }
    }
  }
}

const FILES_9: RubricItem<FilesRubricContext> = {
  code: 'FILES-9',
  title: 'Configuration presentation structure',
  description:
    'Substantial .ki.toml files use exact ordered neighbourhood banners, open with the foundation block, and keep each explicit skill owner with its child tables.',
  sources: [CONFIGURATION_SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reorder source without changing parsed TOML: retain the exact header first, add only needed recognised banners, and keep each owner block contiguous.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files9, 'WARN') }
  }
}

const FILES_2: RubricItem<FilesRubricContext> = {
  code: 'FILES-2',
  title: 'Declared repository identity',
  description:
    'The ki-repo table declares its canonical GitHub repository, title, and description; its title matches the README H1, and a roadmap repository declares repo_code there.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the declared repository identity, README H1, or roadmap code, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files2, 'FAIL') }
  }
}

const FILES_J1: RubricItem<FilesRubricContext> = {
  code: 'FILES-J1',
  title: 'Repository document content',
  description: 'README and license content is accurate and current.',
  sources: [SOURCE],
  judgment: {
    scope: 'The repository README and license.',
    prompt: 'Read the README and license and assess whether they accurately describe and license this repository.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Correct the document, record a named gap, or record an explicit repository-level exclusion.'
  }
}

export const FILES: RubricFamily<RepoRubricContext, FilesRubricContext> = {
  code: 'FILES',
  title: 'Repository files',
  description:
    'Required repository files and document quality, using a local checkout when available or GitHub default-branch evidence for remote-only runs.',
  standard: SOURCE,
  selectContext: (context) => context.files,
  items: [FILES_1, FILES_2, FILES_3, FILES_4, FILES_5, FILES_6, FILES_7, FILES_8, FILES_9, FILES_J1]
}
