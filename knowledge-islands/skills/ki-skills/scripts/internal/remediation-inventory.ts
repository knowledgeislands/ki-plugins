import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export type RemediationClass = 'automatic' | 'diagnostic' | 'guarded'

type LoadedItem = {
  code?: unknown
  mechanical?: {
    remediation?: { class?: unknown; guidance?: unknown }
    conform?: unknown
    conformOn?: unknown
  }
  judgment?: unknown
}

type LoadedDefinition = {
  name?: unknown
  families?: readonly { code?: unknown; items?: readonly LoadedItem[] }[]
}

export type RemediationEntry = {
  skill: string
  family: string
  criterion: string
  remediation?: RemediationClass
  judgment: boolean
  guidance?: string
}

export type RemediationCounts = {
  catalogues: number
  criteria: number
  mechanical: number
  judgment: number
  hybrid: number
  automatic: number
  diagnostic: number
  guarded: number
}

export type RemediationInventory = {
  counts: RemediationCounts
  entries: readonly RemediationEntry[]
  issues: readonly string[]
}

export type PromotionReview = {
  skill: string
  criterion: string
  disposition: 'promoted' | 'deferred' | 'boundary'
  rationale: string
}

/** The only six baseline report-only items that passed the deterministic candidate test. */
export const PROMOTION_REVIEW: readonly PromotionReview[] = [
  {
    skill: 'ki-repo',
    criterion: 'RUNTIMES-2',
    disposition: 'promoted',
    rationale:
      'The required capability set is exactly derivable; publication remains behind a typed host-owned activation proposal.'
  },
  {
    skill: 'ki-skills',
    criterion: 'NAME-1',
    disposition: 'promoted',
    rationale:
      'A missing name is exactly the contained physical skill directory name when frontmatter is a valid mapping.'
  },
  {
    skill: 'ki-decision-records',
    criterion: 'FM-3',
    disposition: 'deferred',
    rationale: 'GOV-040 must first resolve the conflicting Decision Record and Knowledge Base type authorities.'
  },
  {
    skill: 'ki-decision-records',
    criterion: 'FM-4',
    disposition: 'deferred',
    rationale: 'GOV-040 must first resolve the conflicting Decision Record and Knowledge Base type authorities.'
  },
  {
    skill: 'ki-decision-records',
    criterion: 'INDEX-4',
    disposition: 'deferred',
    rationale:
      'A preserving ordered-index normaliser is substantial concern-specific parser work and belongs to its own owner record.'
  },
  {
    skill: 'ki-engineering',
    criterion: 'GEN-1',
    disposition: 'boundary',
    rationale:
      'GOV-044 confirmed a cross-owner criterion and a disproportionate preserving editor; Engineering owns Biome and Knip while ki-authoring wholly owns `.rumdl.toml`.'
  }
]

export const reportOnlyDisposition = (
  entry: RemediationEntry
): 'candidate-deferred' | 'justified-boundary' | undefined => {
  if (entry.remediation !== 'diagnostic' && entry.remediation !== 'guarded') return undefined
  return PROMOTION_REVIEW.some(
    ({ skill, criterion, disposition }) =>
      disposition === 'deferred' && skill === entry.skill && criterion === entry.criterion
  )
    ? 'candidate-deferred'
    : 'justified-boundary'
}

const remediationClasses = new Set<unknown>(['automatic', 'diagnostic', 'guarded'])

const inspectDefinition = (
  definition: LoadedDefinition,
  source: string
): { entries: RemediationEntry[]; issues: string[] } => {
  const entries: RemediationEntry[] = []
  const issues: string[] = []
  if (typeof definition.name !== 'string' || !Array.isArray(definition.families))
    return { entries, issues: [`${source} does not export one named rubric definition`] }

  for (const family of definition.families) {
    if (typeof family.code !== 'string' || !Array.isArray(family.items)) {
      issues.push(`${definition.name}: malformed rubric family in ${source}`)
      continue
    }
    for (const item of family.items) {
      if (typeof item.code !== 'string') {
        issues.push(`${definition.name}/${family.code}: criterion code is missing`)
        continue
      }
      const judgment = item.judgment !== undefined
      const remediation = item.mechanical?.remediation
      const className = remediation?.class
      if (!item.mechanical && !judgment)
        issues.push(`${definition.name}/${item.code}: criterion has neither mechanical nor judgment evidence`)
      if (item.mechanical && !remediationClasses.has(className))
        issues.push(`${definition.name}/${item.code}: mechanical criterion has no recognised remediation class`)

      const typedClass = remediationClasses.has(className) ? (className as RemediationClass) : undefined
      const guidance = typeof remediation?.guidance === 'string' ? remediation.guidance.trim() : undefined
      if (typedClass === 'automatic' && item.mechanical?.conform === undefined)
        issues.push(`${definition.name}/${item.code}: automatic remediation has no conform action`)
      if ((typedClass === 'diagnostic' || typedClass === 'guarded') && item.mechanical?.conform !== undefined)
        issues.push(`${definition.name}/${item.code}: ${typedClass} remediation exposes a conform action`)
      if ((typedClass === 'diagnostic' || typedClass === 'guarded') && item.mechanical?.conformOn !== undefined)
        issues.push(`${definition.name}/${item.code}: ${typedClass} remediation exposes conformOn`)
      if ((typedClass === 'diagnostic' || typedClass === 'guarded') && !guidance)
        issues.push(`${definition.name}/${item.code}: ${typedClass} remediation has no specific guidance`)
      if (typedClass === 'guarded' && !judgment)
        issues.push(`${definition.name}/${item.code}: guarded remediation has no judgment aspect`)

      entries.push({
        skill: definition.name,
        family: family.code,
        criterion: item.code,
        ...(typedClass ? { remediation: typedClass } : {}),
        judgment,
        ...(guidance ? { guidance } : {})
      })
    }
  }
  return { entries, issues }
}

export const inventoryRemediation = async (repository: string): Promise<RemediationInventory> => {
  const root = resolve(repository)
  const skillsRoot = resolve(root, 'skills')
  if (!existsSync(skillsRoot))
    return {
      counts: {
        catalogues: 0,
        criteria: 0,
        mechanical: 0,
        judgment: 0,
        hybrid: 0,
        automatic: 0,
        diagnostic: 0,
        guarded: 0
      },
      entries: [],
      issues: [`${skillsRoot} is unavailable`]
    }

  const paths = [
    ...new Bun.Glob('**/scripts/rubric/items/index.ts').scanSync({ cwd: skillsRoot, absolute: true })
  ].sort()
  const entries: RemediationEntry[] = []
  const issues: string[] = []
  for (const path of paths) {
    try {
      const loaded = (await import(`${pathToFileURL(path).href}?inventory=${Date.now()}`)) as {
        default?: LoadedDefinition
      }
      if (!loaded.default) {
        issues.push(`${path} has no default rubric definition`)
        continue
      }
      const inspected = inspectDefinition(loaded.default, path)
      entries.push(...inspected.entries)
      issues.push(...inspected.issues)
    } catch (error) {
      issues.push(`${path} could not be loaded: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const mechanical = entries.filter(({ remediation }) => remediation !== undefined)
  const judgment = entries.filter((entry) => entry.judgment)
  return {
    counts: {
      catalogues: paths.length,
      criteria: entries.length,
      mechanical: mechanical.length,
      judgment: judgment.length,
      hybrid: mechanical.filter((entry) => entry.judgment).length,
      automatic: mechanical.filter(({ remediation }) => remediation === 'automatic').length,
      diagnostic: mechanical.filter(({ remediation }) => remediation === 'diagnostic').length,
      guarded: mechanical.filter(({ remediation }) => remediation === 'guarded').length
    },
    entries,
    issues
  }
}
