import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type FilesRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const FILES_1: RubricItem<FilesRubricContext> = {
  code: 'FILES-1',
  title: 'Required repository files',
  description: 'README, license, gitignore, editor configuration, Claude orientation, and the exact ki-repo config marker are present.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
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
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.files3, 'FAIL') },
    conform: {
      phase: 'PRIMARY',
      run: (context) => {
        context.ensureAuthoringConfiguration?.()
      }
    }
  }
}

const FILES_J1: RubricItem<FilesRubricContext> = {
  code: 'FILES-J1',
  title: 'Repository document content',
  description: 'README and license content is accurate and current.',
  sources: [SOURCE],
  judgment: { prompt: 'Read the README and license and assess whether they accurately describe and license this repository.' }
}

export const FILES: RubricFamily<RepoRubricContext, FilesRubricContext> = {
  code: 'FILES',
  title: 'Repository files',
  description: 'Required local files and repository document quality.',
  standard: SOURCE,
  selectContext: (context) => context.files,
  items: [FILES_1, FILES_3, FILES_J1]
}
