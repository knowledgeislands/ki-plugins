import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RecordsContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const RECORD_1: RubricItem<RecordsContext> = {
  code: 'RECORD-1',
  title: 'preparation and submission shape is canonical',
  description:
    'Every trade uses one `TRD-` eight lower-case hexadecimal identity repeated in filename, metadata, and H1, a closed sender envelope with kind and observation policy, and non-empty payload sections. A preparation and its submitted successor share one peer path, so shape is judged identically on both sides of submission.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'diagnostic', guidance: 'Correct the locally owned trade record, then rerun the audit.' },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

const RECORD_2: RubricItem<RecordsContext> = {
  code: 'RECORD-2',
  title: 'every copy declares its own phase explicitly',
  description:
    'Every trade record carries a required `phase` drawn from `preparing`, `submitted`, and `received`, and the value matches the copy the record actually is: a preparation or a submitted outbound record beneath `-/_TRADES/<owner>/<name>/`, a received copy beneath `+/_TRADES/<owner>/<name>/`. Submission rewrites the field on a stable path rather than moving the file, so no state is expressed by an absent marker. The retired reserved `-/_TRADES/_PREPARATIONS/` directory is refused. `phase` records the state of the copy and `decision_status` records the disposition of the receiver, on separate axes.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Set the phase of the locally owned record to the value its copy holds, move any record out of a retired `_PREPARATIONS/` directory to its peer path, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ phaseOutcomes }) => phaseOutcomes }
  }
}

const RECORD_3: RubricItem<RecordsContext> = {
  code: 'RECORD-3',
  title: 'a preparation title stays concise',
  description:
    "A trade title is at most six words. The limit is deliberately looser than the four `ki-work-roadmap` allows a work item, because a work item title sits beside its theme, repository-coded identifier, and horizon, while a trade lands alone in another repository and carries its whole meaning to a reader with none of that context. The criterion binds only on a preparation, which is still the sender's to change; a submitted or received copy is immutable evidence, so enforcing a local convention there would demand exactly the rewrite `AUTH-1` exists to detect.",
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Shorten the title of the local preparation before submitting it; never retitle a submitted or received copy.'
    },
    audit: { phase: 'INSPECT', run: ({ titleOutcomes }) => titleOutcomes }
  }
}

export const RECORD: RubricFamily<TradesRubricContext, RecordsContext> = {
  code: 'RECORD',
  title: 'Record shape',
  description: 'One concise identity moves from mutable preparation to immutable submitted record on a stable path.',
  standard: SOURCE,
  selectContext: (context) => context.records,
  items: [RECORD_1, RECORD_2, RECORD_3]
}
