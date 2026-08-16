import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

type DocumentationRubricContext = Record<string, never>

const DOC_1: RubricItem<DocumentationRubricContext> = {
  code: 'DOC-1',
  title: 'Documentation concern ownership',
  description:
    'In a non-Knowledge-Base repository, durable documentation is routed to Decision Records, Specifications, Guides, or the Roadmap; specialist skills retain the content contract for their concern.',
  sources: ['standards-documentation-topology.md'],
  judgment: {
    scope: 'Repository documentation topology and the durable material routed to each concern.',
    prompt:
      'Does each durable documentation concern have the right owner, with decisions explaining choices, Specifications defining behaviour, Guides helping people operate or contribute, and roadmap records tracking planned change?',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Route the material to its owning concern, record a named gap where the required contract is absent, or record an explicit repository-level exclusion.'
  }
}

export const DOC: RubricFamily<RepoRubricContext, DocumentationRubricContext> = {
  code: 'DOC',
  title: 'Documentation topology',
  description: 'Repository-level ownership of durable documentation concerns.',
  standard: 'standards-documentation-topology.md',
  selectContext: () => ({}),
  items: [DOC_1]
}
