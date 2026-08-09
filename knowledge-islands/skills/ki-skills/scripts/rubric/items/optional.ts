import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { DIAGNOSTIC_REMEDIATION, judgment } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, type OptionalRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const COMPATIBILITY_MIN_LENGTH = 1
const COMPATIBILITY_MAX_LENGTH = 500

const OPT_1: RubricItem<OptionalRubricContext> = {
  code: 'OPT-1',
  title: 'compatibility is between 1 and 500 characters when present',
  description: '`compatibility`, if present, is 1–500 chars.',
  sources: ['SPEC'],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ compatibility }) => {
        if (compatibility === undefined) return [{ status: 'NOT_APPLICABLE', message: 'compatibility is not present' }]
        return compatibility.length < COMPATIBILITY_MIN_LENGTH || compatibility.length > COMPATIBILITY_MAX_LENGTH
          ? [
              {
                status: 'VIOLATION',
                message: `\`compatibility\` is ${compatibility.length} chars (must be ${COMPATIBILITY_MIN_LENGTH}–${COMPATIBILITY_MAX_LENGTH})`
              }
            ]
          : [{ status: 'PASS', message: 'compatibility is between 1 and 500 characters when present' }]
      }
    }
  }
}

const OPT_2: RubricItem<OptionalRubricContext> = {
  code: 'OPT-2',
  title: 'metadata is a string-to-string map when present',
  description: '`metadata`, if present, is a string→string map.',
  sources: ['SPEC'],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ metadataPresent, metadata }) => {
        if (!metadataPresent) return [{ status: 'NOT_APPLICABLE', message: 'metadata is not present' }]
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
          return [{ status: 'VIOLATION', message: '`metadata` must be a string-to-string map' }]
        const invalid = Object.entries(metadata as Record<string, unknown>).find(
          ([, value]) => typeof value !== 'string'
        )
        return invalid
          ? [{ status: 'VIOLATION', message: `\`metadata.${invalid[0]}\` must be a string` }]
          : [{ status: 'PASS', message: 'metadata is a string-to-string map when present' }]
      }
    }
  }
}

const OPT_3: RubricItem<OptionalRubricContext> = {
  code: 'OPT-3',
  title: 'tool declarations use valid tool specifications',
  description:
    '`allowed-tools` / `disallowed-tools`, if present, are valid tool specs (`allowed-tools` is **experimental**).',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ allowedToolsPresent, allowedTools, disallowedToolsPresent, disallowedTools }) => {
        if (!allowedToolsPresent && !disallowedToolsPresent)
          return [{ status: 'NOT_APPLICABLE', message: 'tool declarations are not present' }]
        const violations = [
          ...(allowedToolsPresent ? toolDeclarationFindings('allowed-tools', allowedTools) : []),
          ...(disallowedToolsPresent ? toolDeclarationFindings('disallowed-tools', disallowedTools) : [])
        ]
        return violations.length > 0
          ? [violations[0] as (typeof violations)[number], ...violations.slice(1)]
          : [{ status: 'PASS', message: 'tool declarations use valid tool specifications' }]
      }
    }
  }
}

const OPT_4: RubricItem<OptionalRubricContext> = {
  code: 'OPT-4',
  title: 'license declarations are non-empty YAML string scalars',
  description:
    '`license`, if present, is a non-empty YAML string scalar. Prefer a short name or bundled-file reference.',
  sources: ['SPEC'],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ licensePresent, license }) => {
        if (!licensePresent) return [{ status: 'NOT_APPLICABLE', message: 'license is not present' }]
        return typeof license !== 'string' || license.trim() === ''
          ? [{ status: 'VIOLATION', message: '`license` must be a non-empty YAML string scalar' }]
          : [{ status: 'PASS', message: 'license declarations are non-empty YAML string scalars' }]
      }
    }
  }
}

const toolDeclarationFindings = (field: 'allowed-tools' | 'disallowed-tools', value: unknown) => {
  if (typeof value === 'string') {
    const rules = splitToolRules(value)
    return validToolRules(rules)
      ? []
      : [{ status: 'VIOLATION' as const, message: `\`${field}\` must contain non-empty valid tool rules` }]
  }
  if (Array.isArray(value) && value.every((rule) => typeof rule === 'string' && validToolRule(rule))) return []
  return [
    {
      status: 'VIOLATION' as const,
      message: `\`${field}\` must be a non-empty YAML string scalar or sequence of non-empty valid tool rules`
    }
  ]
}

/** Split comma- or whitespace-separated rules, preserving text inside balanced parentheses. */
const splitToolRules = (value: string): string[] | null => {
  const rules: string[] = []
  let rule = ''
  let depth = 0
  for (const character of value) {
    if (character === '(') depth++
    if (character === ')') depth--
    if (depth < 0) return null
    if (depth === 0 && (character === ',' || /\s/.test(character))) {
      if (rule.trim() !== '') rules.push(rule.trim())
      rule = ''
      continue
    }
    rule += character
  }
  if (depth !== 0 || rule.trim() === '') return null
  rules.push(rule.trim())
  return rules
}

const validToolRules = (rules: string[] | null): boolean =>
  rules !== null && rules.length > 0 && rules.every(validToolRule)

/** A rule is `Tool` or `Tool(specifier)`; specifier text may contain balanced nested parentheses. */
const validToolRule = (rule: string): boolean => {
  if (rule.trim() === '') return false
  const opening = rule.indexOf('(')
  if (opening === -1) return !/[(),\s]/.test(rule)
  if (opening === 0 || !rule.endsWith(')') || /[(),\s]/.test(rule.slice(0, opening))) return false
  let depth = 0
  for (let index = opening; index < rule.length; index++) {
    const character = rule[index] as string
    if (character === '(') depth++
    if (character === ')') depth--
    if (depth < 0 || (depth === 0 && index !== rule.length - 1)) return false
  }
  return depth === 0 && rule.slice(opening + 1, -1).trim() !== ''
}

const OPT_5: RubricItem<OptionalRubricContext> = {
  code: 'OPT-5',
  title: 'runtime-specific fields are flagged where portability matters',
  description: 'CC-only fields are flagged when cross-platform portability matters (see ※3).',
  sources: ['CC'],
  judgment: judgment('Where cross-platform portability matters, are runtime-specific fields clearly identified?')
}

const OPT_6: RubricItem<OptionalRubricContext> = {
  code: 'OPT-6',
  title: 'manually timed side effects disable model invocation',
  description:
    'Side-effecting / manually-timed workflows set `disable-model-invocation: true` (contrast `user-invocable: false`).',
  sources: ['CC'],
  judgment: judgment(
    'Do side-effecting or manually timed workflows set disable-model-invocation: true where appropriate?'
  )
}

const OPT_7: RubricItem<OptionalRubricContext> = {
  code: 'OPT-7',
  title: 'discrete modes have an ordered argument hint',
  description:
    'A skill with discrete modes sets `argument-hint`; modes are **named** (not lettered) and **alphabetically ordered**.',
  sources: ['CC', 'COMMUNITY'],
  judgment: judgment('Where the skill has discrete modes, are they named and alphabetically ordered in argument-hint?')
}

export const OPTIONAL: RubricFamily<KiSkillsRubricContext, OptionalRubricContext> = {
  code: 'OPT',
  title: 'Frontmatter: optional fields',
  description: 'Optional portable and runtime-specific frontmatter fields.',
  standard: 'standards-agent-skills.md#6-frontmatter-optional-fields',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'optional'),
  items: [OPT_1, OPT_2, OPT_3, OPT_4, OPT_5, OPT_6, OPT_7]
}
