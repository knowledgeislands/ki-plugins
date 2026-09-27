import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext, DependsRubricContext } from '../contexts/decision-records.ts'

const SOURCE = 'standards-decision-records.md'

const outcomes = (values: AuditOutcome[], passMessage: string): RubricOutcomes<AuditOutcome> =>
  (values.length > 0 ? values : [{ status: 'PASS', message: passMessage }]) as RubricOutcomes<AuditOutcome>

const DEPENDS_1: RubricItem<DependsRubricContext> = {
  code: 'DEPENDS-1',
  title: 'Every dependency in a local scope resolves to a record',
  description:
    'Each `decision_depends_on` entry is a canonical `<PREFIX>-<SCOPE>-NNN` code, and each entry whose scope this collection owns names a record the collection holds. Cross-scope (cross-repo) targets are permitted and are not resolved here.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the dependency to the record it means, or remove it where the target was retired; a renumbered series sweeps this field with every other citation.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: DependsRubricContext) =>
        outcomes(
          [
            ...context.malformedDependencies.map(
              ({ id, target }): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Dependency \`${target}\` is not a canonical Decision Record identifier.`,
                subject: id
              })
            ),
            ...context.unresolvedDependencies.map(
              ({ id, target }): AuditOutcome => ({
                status: 'VIOLATION',
                message: `Dependency \`${target}\` names a scope this collection owns but no record with that identifier exists.`,
                subject: id
              })
            )
          ],
          'Every declared dependency in a locally owned scope resolves to a record in the collection.'
        )
    }
  }
}

const DEPENDS_2: RubricItem<DependsRubricContext> = {
  code: 'DEPENDS-2',
  title: 'The dependency graph is acyclic',
  description:
    'Taken across every prefix at once, `decision_depends_on` forms a directed acyclic graph: no record depends on itself, directly or through a chain. A cycle asserts that each record in it must be read before the others, which no reading order satisfies.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Drop the edge that is a cross-reference rather than a dependency, or merge records that genuinely cannot be reconsidered independently into the one that owns the concern.'
    },
    audit: {
      phase: 'DERIVED',
      run: (context: DependsRubricContext) =>
        outcomes(
          context.dependencyCycles.map(
            (cycle): AuditOutcome => ({
              status: 'VIOLATION',
              message: 'Declared dependencies form a cycle, so no reading order satisfies them.',
              subject: cycle.join(' -> ')
            })
          ),
          'Declared dependencies form a directed acyclic graph across the whole collection.'
        )
    }
  }
}

const DEPENDS_3: RubricItem<DependsRubricContext> = {
  code: 'DEPENDS-3',
  title: 'A dependency precedes its dependent in the index',
  description:
    "Where both records appear in the index's ordered list, a declared dependency appears before the record that depends on it, so reading top to bottom never asks for a decision on trust. Ascending serials give this within one prefix; a cross-prefix edge is constrained by nothing else.",
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Move the dependent later in the reveal order, or correct the field where the edge itself is the error rather than the placement.'
    },
    audit: {
      phase: 'DERIVED',
      run: (context: DependsRubricContext) =>
        outcomes(
          context.dependencyOrderViolations.map(
            ({ id, target }): AuditOutcome => ({
              status: 'VIOLATION',
              message: `Index places this record before \`${target}\`, which it declares as a dependency.`,
              subject: id
            })
          ),
          'Every indexed dependency appears before the record that depends on it.'
        )
    }
  }
}

const DEPENDS_4: RubricItem<DependsRubricContext> = {
  code: 'DEPENDS-4',
  title: 'Body prose cites only backward',
  description:
    'A record names lower-numbered records of its own prefix and scope, never a higher-numbered one. Where a later record extends, narrows, or settles something, the later record says so, so an earlier record never needs editing when something downstream lands.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Remove the forward reference and let the later record state the relationship, which it already declares as a dependency.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context: DependsRubricContext) =>
        outcomes(
          context.forwardCitations.map(
            ({ id, target }): AuditOutcome => ({
              status: 'VIOLATION',
              message: `Body cites \`${target}\`, a higher-numbered record of the same type.`,
              subject: id
            })
          ),
          'No record body cites a higher-numbered record of its own type.'
        )
    }
  }
}

export const DEPENDS: RubricFamily<DecisionRecordsRubricContext, DependsRubricContext> = {
  code: 'DEPENDS',
  title: 'dependency-graph checks',
  description:
    'Declared decision dependencies resolve, stay acyclic, precede their dependents, and prose points backward.',
  standard: SOURCE,
  selectContext: (context) => context.depends,
  items: [DEPENDS_1, DEPENDS_2, DEPENDS_3, DEPENDS_4]
}
