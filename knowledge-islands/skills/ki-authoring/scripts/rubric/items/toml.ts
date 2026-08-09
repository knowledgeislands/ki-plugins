import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, TomlRubricContext } from '../contexts/authoring.ts'

const TOML_KEYS: RubricItem<TomlRubricContext> = {
  code: 'TOML-keys',
  title: 'TOML keys are concise lowercase nouns',
  description:
    'Keys are lowercase, use `snake_case` for multiple words, and name the noun their value holds (`visibility`, not `repo_visibility_setting`).',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: {
    scope: 'Every authored TOML key in the convention scope.',
    prompt: 'Assess whether TOML keys are concise lowercase nouns, using snake_case for multiple words.',
    outcomes: ['conforming', 'rename required', 'exception required'],
    guidance:
      'Rename the key to a concise lowercase noun using snake_case where needed, or record the external-contract exception.'
  }
}

const TOML_VALUES: RubricItem<TomlRubricContext> = {
  code: 'TOML-values',
  title: 'TOML values use the house formatting',
  description: 'Strings are double-quoted and short lists remain inline (`["a", "b"]`).',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: {
    scope: 'Every authored TOML string and short list in the convention scope.',
    prompt: 'Assess whether TOML strings and short lists follow the house formatting.',
    outcomes: ['conforming', 'reformat required', 'exception required'],
    guidance: 'Use double-quoted strings and inline short lists, or record the external-contract exception.'
  }
}

const TOML_TABLES: RubricItem<TomlRubricContext> = {
  code: 'TOML-tables',
  title: 'TOML uses one table per skill',
  description:
    'One table appears per skill, named for that skill, with subtables nested under it; `ki-repo` owns the `.ki-config.toml` contract behind this convention.',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: {
    scope: 'Every shared `.ki-config.toml` skill declaration and its subtables.',
    prompt: 'Assess whether the TOML uses one table per skill with nested subtables where appropriate.',
    outcomes: ['conforming', 'restructure required', 'contract exception'],
    guidance:
      'Restructure declarations into one table per skill with nested subtables, or record the ki-repo contract exception.'
  }
}

const TOML_COMMENTS: RubricItem<TomlRubricContext> = {
  code: 'TOML-comments',
  title: 'non-obvious TOML keys explain their rationale',
  description: 'Non-obvious keys carry a preceding `#` comment explaining why they exist.',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: {
    scope: 'Every non-obvious authored TOML key in the convention scope.',
    prompt: 'Assess whether non-obvious TOML keys carry a preceding rationale comment.',
    outcomes: ['conforming', 'comment required', 'self-evident'],
    guidance: 'Add a preceding rationale comment or record why the key is self-evident in its local context.'
  }
}

export const TOML: RubricFamily<AuthoringRubricContext, TomlRubricContext> = {
  code: 'TOML',
  title: 'TOML formatting',
  description: 'Reviewer-applied TOML formatting conventions.',
  standard: 'standards-toml.md',
  selectContext: (context: AuthoringRubricContext) => context.toml,
  items: [TOML_KEYS, TOML_VALUES, TOML_TABLES, TOML_COMMENTS]
}
