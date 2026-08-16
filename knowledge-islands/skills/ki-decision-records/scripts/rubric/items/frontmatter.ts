import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext, RecordsRubricContext } from '../contexts/decision-records.ts'

const SOURCE = 'standards-decision-records.md'

const outcomes = (values: AuditOutcome[], passMessage: string): RubricOutcomes<AuditOutcome> =>
  (values.length > 0 ? values : [{ status: 'PASS', message: passMessage }]) as RubricOutcomes<AuditOutcome>

const FM_0: RubricItem<RecordsRubricContext> = {
  code: 'FM-0',
  title: 'Decision-record frontmatter',
  description: 'YAML frontmatter block is present on every decision record.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add canonical YAML frontmatter using the record body and filename as evidence.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => !record.frontmatter)
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: 'YAML frontmatter is absent.',
                subject: record.file
              })
            ),
          'Every decision record has YAML frontmatter.'
        )
    }
  }
}

const FM_3: RubricItem<RecordsRubricContext> = {
  code: 'FM-3',
  title: 'No generic type metadata',
  description: 'Generic `type` and `type_url` fields are absent from a decision record.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => /^(type|type_url):/m.test(record.frontmatter ?? ''))
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: 'Generic `type` and `type_url` are not valid decision-record metadata.',
                subject: record.file
              })
            ),
          'No decision record uses generic type metadata.'
        )
    },
    conform: {
      phase: 'NORMALISE',
      run: (context: RecordsRubricContext) => context.conformFrontmatter?.()
    }
  }
}

const FM_4: RubricItem<RecordsRubricContext> = {
  code: 'FM-4',
  title: 'Decision type metadata',
  description: '`decision_type` and `decision_type_url` fields are present.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => !record.decisionType || !record.decisionTypeUrl)
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: '`decision_type` or `decision_type_url` is absent.',
                subject: record.file
              })
            ),
          'Every decision record declares `decision_type` and `decision_type_url`.'
        )
    },
    conform: {
      phase: 'NORMALISE',
      run: (context: RecordsRubricContext) => context.conformFrontmatter?.()
    }
  }
}

const FM_5: RubricItem<RecordsRubricContext> = {
  code: 'FM-5',
  title: 'Prefix and decision type alignment',
  description:
    '`decision_type` and `decision_type_url` exactly match the canonical values encoded by the filename prefix. This does not prove that the prefix is the right semantic classification.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align decision-type metadata with the canonical filename prefix after confirming the record classification.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) => {
        return outcomes(
          context.records
            .filter(
              (record) =>
                record.decisionType !== record.expectedDecisionType ||
                record.decisionTypeUrl !== record.expectedDecisionTypeUrl
            )
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Expected decision_type ${record.expectedDecisionType} and decision_type_url ${record.expectedDecisionTypeUrl}; found ${record.decisionType ?? '(absent)'} and ${record.decisionTypeUrl ?? '(absent)'}.`,
                subject: record.file
              })
            ),
          'Every decision-type field matches the filename prefix.'
        )
      }
    }
  }
}

const FM_6: RubricItem<RecordsRubricContext> = {
  code: 'FM-6',
  title: 'Core decision metadata',
  description: '`id`, `title`, `date`, and `status` are present; ID and title compose the H1 and date uses YYYY-MM-DD.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Complete the required metadata from the canonical H1, filename, and record type.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records.flatMap((record): AuditOutcome[] => {
            if (record.frontmatterId !== record.id)
              return [
                { status: 'VIOLATION', message: '`id` must exactly match the H1 identifier.', subject: record.file }
              ]
            const expectedTitle = record.headingTitle ?? ''
            if (!record.title) return [{ status: 'VIOLATION', message: '`title` is absent.', subject: record.file }]
            if (record.title !== expectedTitle)
              return [
                { status: 'VIOLATION', message: '`title` must exactly match the H1 title.', subject: record.file }
              ]
            if (!record.date) return [{ status: 'VIOLATION', message: '`date` is absent.', subject: record.file }]
            if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date))
              return [{ status: 'VIOLATION', message: '`date` must use YYYY-MM-DD.', subject: record.file }]
            if (!record.status) return [{ status: 'VIOLATION', message: '`status` is absent.', subject: record.file }]
            return []
          }),
          'Every decision record has matching ID and title, YYYY-MM-DD date, and maintenance status.'
        )
    }
  }
}

export const FM: RubricFamily<DecisionRecordsRubricContext, RecordsRubricContext> = {
  code: 'FM',
  title: 'frontmatter checks',
  description: 'Required universal decision metadata.',
  standard: SOURCE,
  selectContext: (context) => context.frontmatter,
  items: [FM_0, FM_3, FM_4, FM_5, FM_6]
}
