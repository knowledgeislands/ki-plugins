import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbAdminContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const mechanical = (
  code: string,
  title: string,
  description: string,
  evidence: (context: KbAdminContext) => KbAdminContext['subdivisions']
): RubricItem<KbAdminContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: evidence }
  }
})

const ADMIN_1 = mechanical(
  'ADMIN-1',
  'optional Admin subdivisions',
  'When Governance/ or Operations/ is active, it has its same-name index; absent subdivisions warn only.',
  (context) => context.subdivisions
)
const ADMIN_2 = mechanical(
  'ADMIN-2',
  'governance charter',
  'An active Admin/Governance/ directory carries Charter.md.',
  (context) => context.charter
)
const ADMIN_3 = mechanical(
  'ADMIN-3',
  'governance conformance record',
  'An active Admin/Governance/ directory carries Conformance.md.',
  (context) => context.conformance
)

export const ADMIN: RubricFamily<KbRubricContext, KbAdminContext> = {
  code: 'ADMIN',
  title: 'Admin zone',
  description: 'Optional Admin subdivisions and their governance baseline.',
  standard: SOURCE,
  selectContext: (context) => context.admin,
  items: [ADMIN_1, ADMIN_2, ADMIN_3]
}
