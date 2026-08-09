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
    remediation: {
      class: 'diagnostic',
      guidance: 'Align the H1 identifier with the filename and retain the established record identity.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records.flatMap((record): AuditOutcome[] => {
            if (!record.headingId)
              return [
                { status: 'VIOLATION', message: 'Canonical decision-record heading is absent.', subject: record.file }
              ]
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
    remediation: {
      class: 'diagnostic',
      guidance: 'Remove the legacy date line after confirming that canonical frontmatter carries the date.'
    },
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
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the missing canonical section with substantive decision-record content.'
    },
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
  judgment: {
    scope: 'The Context section of every active decision record.',
    prompt: 'Assess whether Context states value-neutral forces rather than advocacy.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Revise the context to describe observed forces, record a named Gap, or record an explicit exclusion.'
  }
}

const BODY_6: RubricItem<RecordsRubricContext> = {
  code: 'BODY-6',
  title: 'Active-voice decision',
  description: 'Decision is in active voice ("This island adopts…" or "We will…").',
  sources: [SOURCE],
  judgment: {
    scope: 'The Decision section of every active decision record.',
    prompt: 'Assess whether Decision uses active voice.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Rewrite the decision in active voice, record a named Gap, or record an explicit exclusion.'
  }
}

const BODY_7: RubricItem<RecordsRubricContext> = {
  code: 'BODY-7',
  title: 'Substantive sections',
  description: 'Each section has real, non-placeholder substance.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every required section in every active decision record.',
    prompt: 'Assess whether every required section contains real, non-placeholder substance.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Add substantive content, record a named Gap, or record an explicit exclusion.'
  }
}

const BODY_8: RubricItem<RecordsRubricContext> = {
  code: 'BODY-8',
  title: 'Focused length',
  description: 'Length is one to two pages, roughly 200–500 body words.',
  sources: [SOURCE],
  judgment: {
    scope: 'The body of every active decision record.',
    prompt: 'Assess whether the body is a focused one to two pages, roughly 200–500 words.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Tighten or expand the body while preserving the decision, record a named Gap, or record an explicit exclusion.'
  }
}

const BODY_9: RubricItem<RecordsRubricContext> = {
  code: 'BODY-9',
  title: 'Noun-phrase title',
  description: 'Title is a short noun phrase, not a question or full sentence.',
  sources: [SOURCE],
  judgment: {
    scope: 'The H1 title of every active decision record.',
    prompt: 'Assess whether the title is a short noun phrase rather than a question or full sentence.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Rewrite the title as a concise noun phrase, record a named Gap, or record an explicit exclusion.'
  }
}

const BODY_10: RubricItem<RecordsRubricContext> = {
  code: 'BODY-10',
  title: 'Present-state record',
  description:
    'The record is written as now and carries no historic, superseding, or forward-looking narration. Such content belongs in the ROADMAP or a KB stream, not in a present-state record.',
  sources: [SOURCE],
  judgment: {
    scope: 'The narrative body of every active decision record.',
    prompt:
      'Assess whether the record states the present decision without historic, superseding, forward-looking, parked, or not-yet-started narration.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Move lifecycle narration to its appropriate record, revise to present state, record a named Gap, or record an explicit exclusion.'
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
