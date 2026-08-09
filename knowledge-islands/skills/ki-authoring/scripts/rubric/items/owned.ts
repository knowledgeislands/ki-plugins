import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, OwnedFileEvidence, OwnedRubricContext } from '../contexts/authoring.ts'

const ownedFileAudit = (file: OwnedFileEvidence): AuditOutcome => {
  if (file.exception && file.state === 'canonical')
    return {
      status: 'VIOLATION',
      message: `${file.name} matches the house template but retains a declared exception — remove it because ${file.exception}`,
      subject: file.name
    }
  if (file.exception && file.state === 'drifted')
    return {
      status: 'VIOLATION',
      message: `${file.name} has a declared exception because ${file.exception} — it remains non-canonical; return it to the house template when the constraint ends`,
      subject: file.name
    }
  if (file.state === 'canonical')
    return { status: 'PASS', message: `${file.name} matches the house template`, subject: file.name }
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

const exceptionAudit = (exception: OwnedRubricContext['exceptions'][number]): AuditOutcome | undefined => {
  if (!exception.issue) return undefined
  return {
    status: 'VIOLATION',
    message: `owned_file_exceptions[${JSON.stringify(exception.name)}] ${exception.issue}`,
    subject: 'owned_file_exceptions'
  }
}

const OWN_1: RubricItem<OwnedRubricContext> = {
  code: 'OWN-1',
  title: 'owned authoring configuration matches the house templates',
  description:
    'The skill owns `.editorconfig` and `.rumdl.toml` wholly (SHAPE-16 `owns:`): AUDIT warns on drift from the house templates, while CONFORM transactionally scaffolds missing files and overwrites drifted regular files. A reasoned `owned_file_exceptions` declaration remains a WARN and suppresses only the named regular drifted-file write; it is never a local template. Each template is stored already formatted to the house width so CONFORM output is a fixed point of the governing formatter; a template the repository would reformat leaves every governed repository permanently drifted.',
  sources: ['standards-authoring.md#owned-configuration'],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context): RubricOutcomes<AuditOutcome> => {
        if (!context.targetExists) return [{ status: 'NOT_APPLICABLE', message: 'audit target does not exist' }]
        return context.files
          .map(ownedFileAudit)
          .concat(context.exceptions.flatMap((exception) => exceptionAudit(exception) ?? []))
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

const OWN_2: RubricItem<OwnedRubricContext> = {
  code: 'OWN-2',
  title: 'retired Markdown configuration is absent',
  description:
    'rumdl owns Markdown formatting and linting together, so `.prettierrc.json`, `.prettierignore`, and `.markdownlint-cli2.jsonc` are retired: AUDIT warns while any of them survives and CONFORM removes them. A leftover file is not inert — an editor extension reads it and reformats Markdown against a standard the repository no longer holds, producing drift that the gate then reports without explaining.',
  sources: ['standards-authoring.md#owned-configuration'],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context): RubricOutcomes<AuditOutcome> => {
        if (!context.targetExists) return [{ status: 'NOT_APPLICABLE', message: 'audit target does not exist' }]
        return context.retired.map((file) =>
          file.present
            ? {
                status: 'VIOLATION',
                message: `${file.name} is retired — run "ki repo conform --skill ki-authoring" to remove it`,
                subject: file.name
              }
            : { status: 'PASS', message: `${file.name} is absent`, subject: file.name }
        )
      }
    },
    conform: {
      phase: 'PREPARE',
      run: (context) => {
        for (const file of context.retired) if (file.present) file.remove?.()
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
  items: [OWN_1, OWN_2]
}
