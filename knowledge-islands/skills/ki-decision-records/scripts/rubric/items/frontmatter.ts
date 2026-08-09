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
  title: 'Human-readable record type',
  description: '`type` is the canonical human-readable record type for the filename prefix.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Set `type` to the canonical human-readable value for the record prefix.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => record.type !== record.expectedType)
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Expected type ${record.expectedType}; found ${record.type ?? '(absent)'}.`,
                subject: record.file
              })
            ),
          'Every decision record declares its canonical human-readable type.'
        )
    }
  }
}

const FM_4: RubricItem<RecordsRubricContext> = {
  code: 'FM-4',
  title: 'Decision type metadata',
  description: '`decision_type` field is present.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the canonical `decision_type` metadata derived from the record prefix.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) =>
        outcomes(
          context.records
            .filter((record) => !record.decisionType)
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: '`decision_type` is absent.',
                subject: record.file
              })
            ),
          'Every decision record declares `decision_type`.'
        )
    }
  }
}

const FM_5: RubricItem<RecordsRubricContext> = {
  code: 'FM-5',
  title: 'Prefix and decision type alignment',
  description:
    '`decision_type` exactly matches the canonical value encoded by the filename prefix. This makes required KB metadata internally consistent; it does not prove that the prefix is the right semantic classification.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Align `decision_type` with the canonical filename prefix after confirming the record classification.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: RecordsRubricContext) => {
        return outcomes(
          context.records
            .filter((record) => record.decisionType !== record.expectedDecisionType)
            .map(
              (record): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Expected decision_type ${record.expectedDecisionType}; found ${record.decisionType ?? '(absent)'}.`,
                subject: record.file
              })
            ),
          'Every `decision_type` matches the filename prefix.'
        )
      }
    }
  }
}

const FM_6: RubricItem<RecordsRubricContext> = {
  code: 'FM-6',
  title: 'Core decision metadata',
  description:
    '`id`, `title`, `date`, `status`, and `type_url` are present; ID and title compose the H1, date uses YYYY-MM-DD, and the URL matches the record prefix.',
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
            if (record.typeUrl !== record.expectedTypeUrl)
              return [
                {
                  status: 'VIOLATION',
                  message: `Expected type_url ${record.expectedTypeUrl}; found ${record.typeUrl ?? '(absent)'}.`,
                  subject: record.file
                }
              ]
            return []
          }),
          'Every decision record has matching ID and title, YYYY-MM-DD date, maintenance status, and canonical type URL metadata.'
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
