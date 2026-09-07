export type GitignoreBlock = {
  readonly owner: string
  readonly purpose: string
  readonly rules: readonly string[]
}

export type GitignoreInspection = {
  readonly content: string
  readonly conforming: boolean
  readonly malformed: string | undefined
  readonly unmanagedRules: readonly string[]
}

const MANAGED_PREAMBLE = [
  '# Knowledge Islands managed ignores.',
  '# Edit the owning skill contract, not the marker-bounded blocks below.'
]

const UNMANAGED_HEADER = [
  '# Unmanaged repository-specific ignores',
  '# These rules are preserved but are not currently reconciled by a KI skill.'
]

const RETIRED_RULES = new Set(['.ki/audits/', '.ki/conform/', '.claude/skills/', '.agents/skills/'])
const LEGACY_EQUIVALENTS = new Map([
  ['coverage/', 'reports/'],
  ['/coverage', 'reports/'],
  ['/coverage/', 'reports/'],
  ['site/coverage/', 'reports/'],
  ['/site/coverage', 'reports/'],
  ['/site/coverage/', 'reports/'],
  ['test-results/', 'reports/'],
  ['/test-results', 'reports/'],
  ['playwright-report/', 'reports/'],
  ['/playwright-report', 'reports/'],
  ['/node_modules', 'node_modules/'],
  ['node_modules', 'node_modules/'],
  ['/dist', 'dist/'],
  ['/dist/', 'dist/'],
  ['site/dist/', 'dist/'],
  ['/site/dist', 'dist/'],
  ['/site/dist/', 'dist/'],
  ['site/.wrangler/', '.wrangler/'],
  ['**/.wrangler', '.wrangler/'],
  ['**/.dev.vars', '.dev.vars'],
  ['.env.local', '.env.*'],
  ['.env.development.local', '.env.*'],
  ['.env.test.local', '.env.*'],
  ['.env.production.local', '.env.*']
])
const START_MARKER = /^# ki-repo:ignore:([a-z0-9-]+):start$/
const END_MARKER = /^# ki-repo:ignore:([a-z0-9-]+):end$/

const marker = (owner: string, edge: 'start' | 'end'): string => `# ki-repo:ignore:${owner}:${edge}`

const block = (owner: string, purpose: string, rules: readonly string[]): GitignoreBlock => ({ owner, purpose, rules })

export const managedGitignoreBlocks = (
  declaredSkills: readonly string[],
  runtimeRules: readonly string[]
): readonly GitignoreBlock[] => {
  const declared = new Set(declaredSkills)
  const blocks: GitignoreBlock[] = [
    block('ki-repo', 'Generated reports, local metadata, logs, and runtime projections.', [
      'reports/',
      '.DS_Store',
      'Thumbs.db',
      '.idea/',
      '*.swp',
      '*.swo',
      '*~',
      '.claude/settings.local.json',
      '*.log',
      ...runtimeRules
    ])
  ]

  if (declared.has('ki-engineering')) {
    blocks.push(
      block('ki-engineering', 'TypeScript/Bun dependencies, build output, caches, logs, and real environment files.', [
        'node_modules/',
        ...(declared.has('ki-repo-website') ? [] : ['dist/']),
        '*.tsbuildinfo',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '.env',
        '.env.*',
        '!.env*.example'
      ])
    )
  }

  if (declared.has('ki-repo-website')) {
    blocks.push(block('ki-repo-website', 'Generated website build output.', ['dist/']))
  }

  if (declared.has('ki-repo-website-cloudflare')) {
    blocks.push(
      block('ki-repo-website-cloudflare', 'Cloudflare local runtime state and local development secrets.', [
        '.wrangler/',
        '.dev.vars'
      ])
    )
  }

  return blocks
}

const renderBlock = (entry: GitignoreBlock): readonly string[] => [
  marker(entry.owner, 'start'),
  `# ${entry.purpose}`,
  ...entry.rules,
  marker(entry.owner, 'end')
]

type ParsedSource = {
  readonly malformed: string | undefined
  readonly retained: readonly string[]
}

const withoutManagedSections = (source: string): ParsedSource => {
  const retained: string[] = []
  const lines = source.split(/\r?\n/)
  let activeOwner: string | undefined

  for (const line of lines) {
    const trimmed = line.trim()
    const start = trimmed.match(START_MARKER)?.[1]
    const end = trimmed.match(END_MARKER)?.[1]

    if (start) {
      if (activeOwner) {
        return {
          malformed: `nested managed block ${start} inside ${activeOwner}`,
          retained: lines
        }
      }
      activeOwner = start
      continue
    }

    if (end) {
      if (!activeOwner) {
        return {
          malformed: `managed block ${end} has no start marker`,
          retained: lines
        }
      }
      if (end !== activeOwner) {
        return {
          malformed: `managed block ${activeOwner} closes as ${end}`,
          retained: lines
        }
      }
      activeOwner = undefined
      continue
    }

    if (activeOwner) continue
    if (MANAGED_PREAMBLE.includes(trimmed)) continue
    if (UNMANAGED_HEADER.includes(trimmed)) continue
    retained.push(line)
  }

  if (activeOwner) {
    return {
      malformed: `managed block ${activeOwner} has no end marker`,
      retained: lines
    }
  }

  return { malformed: undefined, retained }
}

const trimEmptyEdges = (lines: readonly string[]): readonly string[] => {
  let start = 0
  let end = lines.length
  while (start < end && !lines[start]?.trim()) start += 1
  while (end > start && !lines[end - 1]?.trim()) end -= 1
  return lines.slice(start, end)
}

const unmanagedLines = (
  source: string,
  blocks: readonly GitignoreBlock[]
): { readonly lines: readonly string[]; readonly malformed: string | undefined } => {
  const parsed = withoutManagedSections(source)
  if (parsed.malformed) {
    return { lines: parsed.retained, malformed: parsed.malformed }
  }

  const managedRules = new Set(blocks.flatMap(({ rules }) => rules))
  const lines = trimEmptyEdges(
    parsed.retained.filter((line) => {
      const trimmed = line.trim()
      const replacement = LEGACY_EQUIVALENTS.get(trimmed)
      return (
        !managedRules.has(trimmed) && !RETIRED_RULES.has(trimmed) && !(replacement && managedRules.has(replacement))
      )
    })
  )
  return { lines, malformed: undefined }
}

const renderComposition = (unmanaged: readonly string[], blocks: readonly GitignoreBlock[]): string =>
  [
    ...MANAGED_PREAMBLE,
    '',
    ...blocks.flatMap((entry, index) => [...(index ? [''] : []), ...renderBlock(entry)]),
    '',
    ...UNMANAGED_HEADER,
    ...(unmanaged.length ? ['', ...unmanaged] : []),
    ''
  ].join('\n')

export const inspectGitignore = (source: string, blocks: readonly GitignoreBlock[]): GitignoreInspection => {
  const unmanaged = unmanagedLines(source, blocks)
  const content = unmanaged.malformed ? source : renderComposition(unmanaged.lines, blocks)
  return {
    content,
    conforming: !unmanaged.malformed && source === content,
    malformed: unmanaged.malformed,
    unmanagedRules: unmanaged.lines.map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
  }
}

export const gitignoreUnmanagedHeader = UNMANAGED_HEADER.join('\n')
