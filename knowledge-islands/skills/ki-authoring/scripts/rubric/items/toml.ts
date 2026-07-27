import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, TomlRubricContext } from '../contexts/authoring.ts'

const TOML_KEYS: RubricItem<TomlRubricContext> = {
  code: 'TOML-keys',
  title: 'TOML keys are concise lowercase nouns',
  description:
    'Keys are lowercase, use `snake_case` for multiple words, and name the noun their value holds (`visibility`, not `repo_visibility_setting`).',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: { prompt: 'Are TOML keys concise lowercase nouns, using snake_case for multiple words?' }
}

const TOML_VALUES: RubricItem<TomlRubricContext> = {
  code: 'TOML-values',
  title: 'TOML values use the house formatting',
  description: 'Strings are double-quoted and short lists remain inline (`["a", "b"]`).',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: { prompt: 'Do TOML strings and short lists follow the house formatting?' }
}

const TOML_TABLES: RubricItem<TomlRubricContext> = {
  code: 'TOML-tables',
  title: 'TOML uses one table per skill',
  description:
    'One table appears per skill, named for that skill, with subtables nested under it; `ki-repo` owns the `.ki-config.toml` contract behind this convention.',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: { prompt: 'Does the TOML use one table per skill with nested subtables where appropriate?' }
}

const TOML_COMMENTS: RubricItem<TomlRubricContext> = {
  code: 'TOML-comments',
  title: 'non-obvious TOML keys explain their rationale',
  description: 'Non-obvious keys carry a preceding `#` comment explaining why they exist.',
  sources: ['standards-toml.md#keys-and-values'],
  judgment: { prompt: 'Do non-obvious TOML keys carry a preceding rationale comment?' }
}

export const TOML: RubricFamily<AuthoringRubricContext, TomlRubricContext> = {
  code: 'TOML',
  title: 'TOML formatting',
  description: 'Reviewer-applied TOML formatting conventions.',
  standard: 'standards-toml.md',
  selectContext: (context: AuthoringRubricContext) => context.toml,
  items: [TOML_KEYS, TOML_VALUES, TOML_TABLES, TOML_COMMENTS]
}
