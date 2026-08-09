import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type FilesRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

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
        context.ensureGitignore?.()
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
        context.ensureRuntimeSkillIgnore?.()
      }
    }
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
  items: [FILES_1, FILES_2, FILES_3, FILES_4, FILES_J1]
}
