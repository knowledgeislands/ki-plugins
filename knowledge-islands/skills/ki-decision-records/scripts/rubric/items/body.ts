import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext, RecordsRubricContext } from '../contexts/decision-records.ts'

const SOURCE = 'standards-decision-records.md'

const outcomes = (values: AuditOutcome[], passMessage: string): RubricOutcomes<AuditOutcome> =>
  (values.length > 0 ? values : [{ status: 'PASS', message: passMessage }]) as RubricOutcomes<AuditOutcome>

const BODY_1: RubricItem<RecordsRubricContext> = {
  code: 'BODY-1',
  title: 'Canonical heading',
  description: 'Heading matches `# <PREFIX>-<SCOPE>-NNN: <title>`; the ID prefix is present and matches the filename.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records.flatMap((record): AuditOutcome[] => {
            if (!record.headingId)
              return [{ status: 'VIOLATION', message: 'Canonical decision-record heading is absent.', subject: record.file }]
            if (record.headingId !== record.id)
              return [
                {
                  status: 'VIOLATION',
                  level: 'WARN',
                  message: `Heading ID is ${record.headingId}; expected ${record.id}.`,
                  subject: record.file
                }
              ]
            return []
          }),
          'Every decision-record heading has the canonical form and matches its filename.'
        )
    }
  }
}

const BODY_3: RubricItem<RecordsRubricContext> = {
  code: 'BODY-3',
  title: 'No legacy date line',
  description: 'A decision record does not carry a legacy bold `**Date:**` line; its date belongs in frontmatter.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => /^\*\*Date:\*\*/m.test(record.body))
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: 'Move the legacy `**Date:**` line into frontmatter.',
                subject: record.file
              })
            ),
          'Every decision-record date is represented only in frontmatter.'
        )
    }
  }
}

const BODY_4: RubricItem<RecordsRubricContext> = {
  code: 'BODY-4',
  title: 'Required decision sections',
  description: '`## Context`, `## Decision`, and `## Consequences` sections are all present.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records.flatMap((record) =>
            record.missingSections.map(
              (section): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Required section is absent: ${section}.`,
                subject: record.file
              })
            )
          ),
          'Every decision record contains Context, Decision, and Consequences sections.'
        )
    }
  }
}

const BODY_5: RubricItem<RecordsRubricContext> = {
  code: 'BODY-5',
  title: 'Value-neutral context',
  description: 'Context is value-neutral forces, not advocacy ("the island currently…" not "we need to…").',
  sources: [SOURCE],
  judgment: { prompt: 'Assess whether Context states value-neutral forces rather than advocacy.' }
}

const BODY_6: RubricItem<RecordsRubricContext> = {
  code: 'BODY-6',
  title: 'Active-voice decision',
  description: 'Decision is in active voice ("This island adopts…" or "We will…").',
  sources: [SOURCE],
  judgment: { prompt: 'Assess whether Decision uses active voice.' }
}

const BODY_7: RubricItem<RecordsRubricContext> = {
  code: 'BODY-7',
  title: 'Substantive sections',
  description: 'Each section has real, non-placeholder substance.',
  sources: [SOURCE],
  judgment: { prompt: 'Assess whether every required section contains real, non-placeholder substance.' }
}

const BODY_8: RubricItem<RecordsRubricContext> = {
  code: 'BODY-8',
  title: 'Focused length',
  description: 'Length is one to two pages, roughly 200–500 body words.',
  sources: [SOURCE],
  judgment: { prompt: 'Assess whether the body is a focused one to two pages, roughly 200–500 words.' }
}

const BODY_9: RubricItem<RecordsRubricContext> = {
  code: 'BODY-9',
  title: 'Noun-phrase title',
  description: 'Title is a short noun phrase, not a question or full sentence.',
  sources: [SOURCE],
  judgment: { prompt: 'Assess whether the title is a short noun phrase rather than a question or full sentence.' }
}

const BODY_10: RubricItem<RecordsRubricContext> = {
  code: 'BODY-10',
  title: 'Present-state record',
  description:
    'The record is written as now and carries no historic, superseding, or forward-looking narration. Such content belongs in the ROADMAP or a KB stream, not in a present-state record.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Assess whether the record states the present decision without historic, superseding, forward-looking, parked, or not-yet-started narration.'
  }
}

export const BODY: RubricFamily<DecisionRecordsRubricContext, RecordsRubricContext> = {
  code: 'BODY',
  title: 'body structure checks',
  description: 'Present-state decision-record structure and writing quality.',
  standard: SOURCE,
  selectContext: (context) => context.body,
  items: [BODY_1, BODY_3, BODY_4, BODY_5, BODY_6, BODY_7, BODY_8, BODY_9, BODY_10]
}
