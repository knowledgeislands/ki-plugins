import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, OwnedFileEvidence, OwnedRubricContext } from '../contexts/authoring.ts'

const ownedFileAudit = (file: OwnedFileEvidence): AuditOutcome => {
  if (file.state === 'canonical') return { status: 'PASS', message: `${file.name} matches the house template`, subject: file.name }
  if (file.state === 'unsafe')
    return {
      status: 'VIOLATION',
      message: `${file.name} is not a regular non-symlink file — replace it with a regular file before running CONFORM`,
      subject: file.name
    }
  const reason = file.state === 'missing' ? 'is missing' : 'has drifted from the house template'
  return {
    status: 'VIOLATION',
    message: `${file.name} ${reason} — run "ki repo conform --skill ki-authoring" to ${file.state === 'missing' ? 'scaffold it' : 'correct it'}`,
    subject: file.name
  }
}

const OWN_1: RubricItem<OwnedRubricContext> = {
  code: 'OWN-1',
  title: 'owned authoring configuration matches the house templates',
  description:
    'The skill owns `.prettierrc.json`, `.editorconfig`, and `.markdownlint-cli2.jsonc` wholly (SHAPE-16 `owns:`): AUDIT warns on drift from the house templates, while CONFORM transactionally scaffolds missing files and overwrites drifted regular files.',
  sources: ['standards-authoring.md#owned-configuration'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context): RubricOutcomes<AuditOutcome> => {
        if (!context.targetExists) return [{ status: 'NOT_APPLICABLE', message: 'audit target does not exist' }]
        return context.files.map(ownedFileAudit)
      }
    },
    conform: {
      phase: 'PREPARE',
      run: (context) => {
        for (const file of context.files) if (file.state !== 'canonical') file.synchronise?.()
      }
    }
  }
}

export const OWNED: RubricFamily<AuthoringRubricContext, OwnedRubricContext> = {
  code: 'OWN',
  title: 'Owned authoring configuration',
  description: 'Configuration files wholly owned by the authoring convention.',
  standard: 'standards-authoring.md#owned-configuration',
  selectContext: (context: AuthoringRubricContext) => context.owned,
  items: [OWN_1]
}
