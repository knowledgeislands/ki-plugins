import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbConfigContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const mechanical = (
  code: string,
  title: string,
  description: string,
  evidence: (context: KbConfigContext) => KbConfigContext['knownKeys']
): RubricItem<KbConfigContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the selected ki-repo-kb configuration evidence, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: evidence }
  }
})

const CONFIG_1 = mechanical(
  'CONFIG-1',
  'known configuration keys',
  'Only required_frontmatter, preflight, zones, and templates are recognised beneath [skills.ki-repo-kb].',
  (context) => context.knownKeys
)
const CONFIG_2 = mechanical(
  'CONFIG-2',
  'non-redundant zone aliases',
  'A zone alias does not restate its canonical folder name.',
  (context) => context.nonRedundantAliases
)
const CONFIG_3 = mechanical(
  'CONFIG-3',
  'canonical zone alias keys',
  'Every [skills.ki-repo-kb.zones] key names a canonical zone or staging area.',
  (context) => context.canonicalAliasKeys
)
const CONFIG_4 = mechanical(
  'CONFIG-4',
  'KB configuration boundary',
  'The checker reads and validates only the ki-repo-kb table, leaving every sibling table untouched.',
  (context) => context.boundary
)
const CONFIG_5 = mechanical(
  'CONFIG-5',
  'declared preflight paths',
  'Literal preflight paths resolve under the base; globs remain runtime-resolved.',
  (context) => context.preflightPaths
)

export const CONFIG: RubricFamily<KbRubricContext, KbConfigContext> = {
  code: 'CONFIG',
  title: 'KB configuration',
  description: 'Validate-down `[skills.ki-repo-kb]` configuration and zone aliases.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CONFIG_1, CONFIG_2, CONFIG_3, CONFIG_4, CONFIG_5]
}
