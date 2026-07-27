import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsConfigContext, TokenomicsRubricContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const CFG_1: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-1',
  title: 'Config validates down',
  description: 'The repository-local ki-tokenomics configuration table is parsed and validated down when repository evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.validates }
  }
}

const CFG_2: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-2',
  title: 'Education emits defaults',
  description: 'Repository education emits the default configuration keys.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.educationDefaults }
  }
}

const CFG_3: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-3',
  title: 'Configuration is warranted',
  description: 'Budgets and expectations are warranted for the environment.',
  sources: [SOURCE],
  judgment: { prompt: 'Are budgets and expectations warranted for this environment?' }
}

const CFG_4: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-4',
  title: 'Portable model type is declared',
  description: 'A portable preferred model type is declared when repository configuration evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.preferredModelType }
  }
}

const CFG_5: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-5',
  title: 'Model bindings are valid',
  description: 'Optional model-tier bindings have valid keys and non-empty values when repository configuration evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.modelBindings }
  }
}

export const CFG: RubricFamily<TokenomicsRubricContext, TokenomicsConfigContext> = {
  code: 'CFG',
  title: 'Configuration table',
  description: 'Tokenomics configuration table.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CFG_1, CFG_2, CFG_3, CFG_4, CFG_5]
}
