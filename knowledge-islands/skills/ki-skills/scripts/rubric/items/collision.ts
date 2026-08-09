import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { DIAGNOSTIC_REMEDIATION, judgment } from '../../shared/rubric.ts'
import { type CollisionRubricContext, type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const triggerPhrases = (description: string): string[] => {
  const phrases = new Set<string>()
  const quoted = /"([^"]{2,})"/g
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((match = quoted.exec(description)) !== null) {
    const phrase = (match[1] as string).toLowerCase().replace(/\s+/g, ' ').trim()
    if (phrase) phrases.add(phrase)
  }
  return [...phrases]
}

const COLL_1: RubricItem<CollisionRubricContext> = {
  code: 'COLL-1',
  title: 'quoted trigger phrases are not shared across skills',
  description:
    '_Shared triggers._ Within a set of ≥ 2 skills, no two `description`s declare the **same quoted trigger phrase** (WARN — a shared trigger signals scopes that overlap and need separating).',
  sources: ['COMMUNITY', 'ki-agentic-harness README'],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ targets }) => {
        if (targets.length < 2)
          return [{ status: 'NOT_APPLICABLE', message: 'fewer than two skill descriptions to compare' }]
        const byPhrase = new Map<string, Set<string>>()
        for (const target of targets)
          for (const phrase of triggerPhrases(target.description)) {
            if (!byPhrase.has(phrase)) byPhrase.set(phrase, new Set())
            byPhrase.get(phrase)?.add(target.name)
          }
        const violations = [...byPhrase]
          .filter(([, skills]) => skills.size > 1)
          .map(([phrase, skills]) => ({
            status: 'VIOLATION' as const,
            message: `trigger "${phrase}" is shared by ${[...skills].sort().join(', ')} — confirm each names the other as an off-ramp (COLL-2)`
          }))
          .sort((left, right) => left.message.localeCompare(right.message))
        const [firstViolation, ...remainingViolations] = violations
        return firstViolation
          ? [firstViolation, ...remainingViolations]
          : [{ status: 'PASS', message: 'no quoted trigger phrases are shared across skills' }]
      }
    }
  }
}

const COLL_2: RubricItem<CollisionRubricContext> = {
  code: 'COLL-2',
  title: 'adjacent skills have non-overlapping scope and reciprocal off-ramps',
  description:
    "_Non-overlapping scope by design, with a reciprocal off-ramp where adjacency remains._ The first guard is **design**: skills are scoped so they don't compete for the same request, and each `description` is primarily **self-scoped** (what it does, and briefly what it doesn't). Where two skills are nonetheless genuinely adjacent, **each** description names the other as the off-ramp — the reciprocal pattern (`ki-repo-mcp` ↔ `ki-skills`); a one-directional guard is a half-fix. A COLL-1 hit means the scopes overlap and the **design** needs fixing first, before any off-ramp papers over it.",
  sources: ['standard §15', 'ki-agentic-harness README'],
  judgment: judgment(
    'Do adjacent skills have non-overlapping scopes and reciprocal off-ramps where their requests are genuinely adjacent?'
  )
}

export const COLLISION: RubricFamily<KiSkillsRubricContext, CollisionRubricContext> = {
  code: 'COLL',
  title: 'Cross-skill collision',
  description: 'Selection boundaries across a set of skills.',
  standard: 'standards-knowledge-islands.md#3-cross-skill-collision',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'collision'),
  items: [COLL_1, COLL_2]
}
