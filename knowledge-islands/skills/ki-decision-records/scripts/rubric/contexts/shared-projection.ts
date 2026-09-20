export const SHARED_DECISION_FIELDS = [
  'id',
  'title',
  'date',
  'status',
  'decision_type',
  'decision_type_url',
  'decision_depends_on',
  'shared_record'
] as const

export const SHARED_DECISION_EXCLUDED_FIELDS = ['note_type'] as const

export type SharedDecisionProjection = { projection?: string; issue?: string }

const normaliseBody = (body: string): string => body.replace(/\r\n/g, '\n')

export const projectSharedDecisionRecord = (content: string): SharedDecisionProjection => {
  const document = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/)
  if (!document?.[1]) return { issue: 'shared record has no complete YAML frontmatter document' }

  let frontmatter: Record<string, unknown>
  try {
    const parsed = Bun.YAML.parse(document[1])
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { issue: 'shared record frontmatter is not a YAML mapping' }
    frontmatter = parsed as Record<string, unknown>
  } catch (error) {
    return { issue: `shared record frontmatter is invalid YAML: ${String(error)}` }
  }

  if (frontmatter.shared_record !== true) return { issue: 'shared record projection requires shared_record: true' }

  const owned = new Set<string>(SHARED_DECISION_FIELDS)
  const excluded = new Set<string>(SHARED_DECISION_EXCLUDED_FIELDS)
  const unknown = Object.keys(frontmatter)
    .filter((field) => !owned.has(field) && !excluded.has(field))
    .sort()
  if (unknown.length > 0)
    return {
      issue: `shared record has unknown frontmatter field${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}`
    }

  const canonical: Record<string, unknown> = {}
  for (const field of SHARED_DECISION_FIELDS)
    if (Object.hasOwn(frontmatter, field)) canonical[field] = frontmatter[field]

  const body = normaliseBody(content.slice(document[0].length))
  return { projection: `${JSON.stringify(canonical)}\n---\n${body}` }
}
