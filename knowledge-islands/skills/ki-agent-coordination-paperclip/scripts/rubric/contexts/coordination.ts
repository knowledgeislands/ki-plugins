import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

export type PaperclipCoordinationContext = {
  rubric: RubricPublicationContext
  organisation: { outcomes: readonly AuditOutcome[] }
}

export const createPaperclipCoordinationSession = ({
  configuration,
  publication
}: RubricContextOptions): RubricSession<PaperclipCoordinationContext> => {
  const outcomes: AuditOutcome[] = []
  for (const key of Object.keys(configuration))
    if (key !== 'organisation_code')
      outcomes.push({
        status: 'VIOLATION',
        message: `unrecognised ki-agent-coordination-paperclip configuration key ${key}`,
        subject: '.ki.toml'
      })
  if (typeof configuration.organisation_code !== 'string' || !/^[A-Z][A-Z0-9]*$/.test(configuration.organisation_code))
    outcomes.push({
      status: 'VIOLATION',
      message: 'organisation_code must be a non-empty uppercase organisation identifier',
      subject: '.ki.toml'
    })
  const context: PaperclipCoordinationContext = {
    rubric: { publication },
    organisation: {
      outcomes: outcomes.length
        ? outcomes
        : [{ status: 'PASS', message: 'Organisation code is explicitly configured.' }]
    }
  }
  return {
    subjects: [
      {
        families: ['COORD', 'ORG'],
        context: () => context,
        subject: 'KI–Paperclip coordination arrangement'
      },
      { families: ['RUBRIC'], context: () => context, subject: 'ki-agent-coordination-paperclip' }
    ],
    proposal: () => ({ writes: [] })
  }
}
