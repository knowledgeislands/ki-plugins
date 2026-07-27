import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type KiCheckerRubricContext, type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const KI_CHECKER_1: RubricItem<KiCheckerRubricContext> = {
  code: 'KI-CHECKER-1',
  title: 'rubric sessions scope subjects beneath the repository root',
  description:
    '`ki repo audit` and `ki repo conform` pass the repository root to `createSession`. The skill discovers only its governed subjects beneath that root and represents an absent scope explicitly with `NOT_APPLICABLE`; it does not reinterpret the root as its content directory, scan unrelated files, or claim a vacuous pass.',
  sources: ['standards-rubric-authoring.md#context-and-evidence', 'standards-rubric-authoring.md#host-and-session-boundary'],
  judgment: {
    prompt: 'Does the rubric session discover only its governed subjects and represent an absent scope explicitly?'
  }
}

const KI_CHECKER_2: RubricItem<KiCheckerRubricContext> = {
  code: 'KI-CHECKER-2',
  title: 'skill implementation imports remain inside its own payload',
  description:
    "A skill's `scripts/**/*.ts` files contain no static `from`, dynamic `import()`, or CommonJS `require()` relative import that resolves outside its own `scripts/` directory. A portable rubric dependency is copied into `scripts/shared/rubric.ts`, so every rubric item and context remains typecheckable inside the skill root.",
  sources: ['KI'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ imports }) => {
        const violations = imports
          .filter((entry) => !entry.resolvesInsideScripts)
          .map((entry) => ({
            status: 'VIOLATION' as const,
            message: `\`scripts/${entry.entry}\` imports \`${entry.specifier}\`, which resolves outside its own scripts directory`
          }))
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'skill script imports remain inside its own payload' }]
      }
    }
  }
}

const KI_CHECKER_3: RubricItem<KiCheckerRubricContext> = {
  code: 'KI-CHECKER-3',
  title: 'ki-skills publishes the portable rubric contract',
  description:
    '`ki-skills` publishes the sole portable shared dependency, `scripts/shared/rubric.ts`, declared as `ki-shared-modules: [rubric]`. It provides catalogue authoring types for independently installed skills; `ki` owns execution, reporting, and transaction handling. The provider never declares a dependency on itself.',
  sources: ['ADR-KI-HARNESS-SKILLS-012'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ rootSkill, declaredSharedModules, sharedDependencies, rubricModuleExists }) => {
        if (!rootSkill) return [{ status: 'NOT_APPLICABLE', message: 'the audited skill is not the shared rubric-contract provider' }]
        const violations = []
        if (declaredSharedModules.length !== 1 || declaredSharedModules[0] !== 'rubric')
          violations.push({
            status: 'VIOLATION' as const,
            message: '`ki-skills` must expose only `rubric` under `ki-shared-modules:`'
          })
        if (!rubricModuleExists)
          violations.push({
            status: 'VIOLATION' as const,
            message: '`ki-skills` must ship `scripts/shared/rubric.ts` from its own files'
          })
        const selfDependencies = sharedDependencies.filter((dependency) => dependency.startsWith('ki-skills:'))
        if (selfDependencies.length > 0)
          violations.push({
            status: 'VIOLATION' as const,
            message: `\`ki-skills\` must use its owned rubric contract directly, not declare ${selfDependencies.join(', ')}`
          })
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'ki-skills publishes the portable rubric contract' }]
      }
    }
  }
}

const KI_CHECKER_4: RubricItem<KiCheckerRubricContext> = {
  code: 'KI-CHECKER-4',
  title: 'structured rubric items follow the uniform family layout',
  description:
    '`scripts/rubric/items/index.ts` is catalogue wiring only. Each family is imported from one semantic family module, which exports only that complete ordered `RubricFamily`; item constants and helpers remain private. Rule definitions and execution callbacks do not live in the catalogue index.',
  sources: ['standards-rubric-authoring.md#rubric-families-and-items'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ structuredRubricRequired, itemsIndexExists, itemsIndexDefinesRules, familyModules }) => {
        if (!structuredRubricRequired)
          return [{ status: 'NOT_APPLICABLE', message: 'the skill does not publish a structured rubric catalogue' }]
        const violations = []
        if (!itemsIndexExists) violations.push({ status: 'VIOLATION' as const, message: '`scripts/rubric/items/index.ts` is missing' })
        if (itemsIndexDefinesRules)
          violations.push({
            status: 'VIOLATION' as const,
            message: '`scripts/rubric/items/index.ts` defines rule execution instead of catalogue wiring only'
          })
        if (itemsIndexExists && familyModules.length === 0)
          violations.push({ status: 'VIOLATION' as const, message: 'the rubric catalogue defines no imported family collections' })
        for (const family of familyModules) {
          if (family.source === null)
            violations.push({
              status: 'VIOLATION' as const,
              message: `family collection \`${family.collection}\` is not imported from an existing local family module`
            })
          else {
            if (!family.exportsOrderedCollection)
              violations.push({
                status: 'VIOLATION' as const,
                message: `family module for \`${family.collection}\` does not export its ordered collection`
              })
            if (family.unexpectedExports.length > 0)
              violations.push({
                status: 'VIOLATION' as const,
                message: `family module for \`${family.collection}\` exports additional public symbols: ${family.unexpectedExports.join(', ')}`
              })
          }
        }
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'structured rubric items follow the uniform family layout' }]
      }
    }
  }
}

const KI_CHECKER_5: RubricItem<KiCheckerRubricContext> = {
  code: 'KI-CHECKER-5',
  title: 'shared and internal script packaging is explicit',
  description:
    'Private implementation belongs under `scripts/internal/`; cross-skill modules belong under `scripts/shared/`, whose non-test entries must exactly match the modules published through `ki-shared-modules:` or materialised through `ki-shared-dependencies:`.',
  sources: ['KI'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ declaredSharedModules, legacyLibPresent, presentSharedModules, sharedDependencies }) => {
        const violations = []
        if (legacyLibPresent)
          violations.push({ status: 'VIOLATION' as const, message: 'classify `scripts/lib/` contents as shared or internal' })
        const dependencyModules = sharedDependencies
          .map((dependency) => dependency.split(':').at(-1))
          .filter((module): module is string => Boolean(module))
        const declared = [...new Set([...declaredSharedModules, ...dependencyModules])].sort()
        const present = [...new Set(presentSharedModules)].sort()
        if (declared.join('\n') !== present.join('\n'))
          violations.push({
            status: 'VIOLATION' as const,
            message: `\`scripts/shared/\` must exactly match published and materialised modules (declared: ${declared.join(', ') || 'none'}; present: ${present.join(', ') || 'none'})`
          })
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'shared and internal script packaging is explicit' }]
      }
    }
  }
}

export const KI_CHECKER: RubricFamily<KiSkillsRubricContext, KiCheckerRubricContext> = {
  code: 'KI-CHECKER',
  title: 'Knowledge Islands rubric contract',
  description: 'Knowledge Islands catalogue, session, and packaging responsibilities.',
  standard: 'standards-rubric-authoring.md',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'checker'),
  items: [KI_CHECKER_1, KI_CHECKER_2, KI_CHECKER_3, KI_CHECKER_4, KI_CHECKER_5]
}
