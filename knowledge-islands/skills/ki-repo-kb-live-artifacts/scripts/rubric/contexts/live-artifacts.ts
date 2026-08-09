import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const INDEX_NOTE = 'Live Artifacts.md'
const DEFAULT_ARTIFACTS_DIRECTORY = 'Admin/Operations/Live Artifacts'
const DEFAULT_THRESHOLD_HOURS = 24
const CONFIG_TABLE = 'ki-repo-kb-live-artifacts'

type ArtifactSource = {
  relativePath: string
  stem: string
  htmlPath: string
  text: string
  frontmatter: Readonly<Record<string, string>> | null
  mtimeMs: number
  htmlMtimeMs: number | null
}

export type LiveArtifactsStructureContext = {
  index: readonly AuditOutcome[]
  publishedSources: readonly AuditOutcome[]
  orphanedRenders: readonly AuditOutcome[]
  freshness: readonly AuditOutcome[]
  ensureIndex?: () => void
}

export type LiveArtifactsFrontmatterContext = {
  status: readonly AuditOutcome[]
  renders: readonly AuditOutcome[]
  author: readonly AuditOutcome[]
  ensureRenders?: () => void
}

export type LiveArtifactsRubricContext = {
  rubric: RubricPublicationContext
  structure: LiveArtifactsStructureContext
  frontmatter: LiveArtifactsFrontmatterContext
}

type LiveArtifactsConfiguration = {
  artifactsDirectory: string
  thresholdHours: number
}

const isDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()

const isRegularFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

const parseFrontmatter = (text: string): Record<string, string> | null => {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const values: Record<string, string> = {}
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index] as string
    if (line.trim() === '---') return values
    if (/^\s/.test(line)) continue
    const separator = line.indexOf(':')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    if (key) values[key] = value
  }
  return null
}

const parseConfiguration = (repository: string): LiveArtifactsConfiguration => {
  const path = join(repository, '.ki-config.toml')
  if (!isRegularFile(path))
    return { artifactsDirectory: DEFAULT_ARTIFACTS_DIRECTORY, thresholdHours: DEFAULT_THRESHOLD_HOURS }
  try {
    const document = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const skills = document.skills
    const value = skills && typeof skills === 'object' ? (skills as Record<string, unknown>)[CONFIG_TABLE] : undefined
    const table = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
    const configuredDirectory = table.artifacts_dir
    const artifactsDirectory =
      typeof configuredDirectory === 'string' &&
      configuredDirectory.length > 0 &&
      !isAbsolute(configuredDirectory) &&
      !configuredDirectory.split(/[\\/]/).includes('..')
        ? configuredDirectory
        : DEFAULT_ARTIFACTS_DIRECTORY
    const configuredThreshold = table.sync_threshold_hours
    const thresholdHours =
      typeof configuredThreshold === 'number' && Number.isFinite(configuredThreshold) && configuredThreshold >= 0
        ? configuredThreshold
        : DEFAULT_THRESHOLD_HOURS
    return { artifactsDirectory, thresholdHours }
  } catch {
    return { artifactsDirectory: DEFAULT_ARTIFACTS_DIRECTORY, thresholdHours: DEFAULT_THRESHOLD_HOURS }
  }
}

const violationsOrPass = (
  violations: readonly AuditOutcome[],
  pass: string,
  notApplicable?: string
): readonly AuditOutcome[] => {
  if (notApplicable) return [{ status: 'NOT_APPLICABLE', message: notApplicable }]
  return violations.length > 0 ? violations : [{ status: 'PASS', message: pass }]
}

const addRendersDeclaration = (text: string): string => {
  const lines = text.split('\n')
  if (lines[0]?.trim() !== '---') return text
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (closing < 0) return text
  lines.splice(closing, 0, 'renders: html')
  return lines.join('\n')
}

export const createLiveArtifactsSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<LiveArtifactsRubricContext> => {
  const root = resolve(repository)
  const configuration = parseConfiguration(root)
  const artifactsDirectory = join(root, configuration.artifactsDirectory)
  const directoryExists = isDirectory(artifactsDirectory)
  const indexPath = join(artifactsDirectory, INDEX_NOTE)
  const indexRelativePath = relative(root, indexPath)
  const indexSafe = !existsSync(indexPath) || isRegularFile(indexPath)
  const indexText = isRegularFile(indexPath) ? readFileSync(indexPath, 'utf8') : null
  const names = directoryExists ? readdirSync(artifactsDirectory, { withFileTypes: true }) : []
  const sources: ArtifactSource[] = names
    .filter((entry) => entry.isFile() && extname(entry.name) === '.md' && entry.name !== INDEX_NOTE)
    .map((entry) => {
      const path = join(artifactsDirectory, entry.name)
      const text = readFileSync(path, 'utf8')
      const htmlPath = join(artifactsDirectory, `${basename(path, '.md')}.html`)
      return {
        relativePath: relative(root, path),
        stem: basename(path, '.md'),
        htmlPath,
        text,
        frontmatter: parseFrontmatter(text),
        mtimeMs: lstatSync(path).mtimeMs,
        htmlMtimeMs: isRegularFile(htmlPath) ? lstatSync(htmlPath).mtimeMs : null
      }
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  const htmlPaths = new Set(
    names
      .filter((entry) => entry.isFile() && extname(entry.name) === '.html')
      .map((entry) => join(artifactsDirectory, entry.name))
  )
  const absent = !directoryExists
  const noSources = directoryExists && sources.length === 0
  const unavailable = absent
    ? `The live artifacts directory ${configuration.artifactsDirectory}/ is absent.`
    : noSources
      ? 'No artifact sources exist.'
      : undefined
  const missingIndexSources =
    indexText === null
      ? []
      : sources.filter(
          (source) => !indexText.includes(basename(source.relativePath)) && !indexText.includes(source.stem)
        )
  const missingRenders = sources.filter(
    (source) => source.frontmatter !== null && !Object.hasOwn(source.frontmatter, 'renders')
  )
  const originals = new Map<string, string | null>([
    [indexRelativePath, indexText],
    ...sources.map((source): [string, string] => [source.relativePath, source.text])
  ])
  const drafts = new Map(originals)

  const index: AuditOutcome[] =
    unavailable === undefined
      ? indexText === null
        ? [{ status: 'VIOLATION', message: 'The live artifacts index note is absent.', subject: indexRelativePath }]
        : missingIndexSources.length > 0
          ? [
              {
                status: 'INFO',
                message: `The index omits ${missingIndexSources.map((source) => source.stem).join(', ')}.`,
                subject: indexRelativePath
              }
            ]
          : [
              {
                status: 'PASS',
                message: `The index note is present for ${sources.length} source(s).`,
                subject: indexRelativePath
              }
            ]
      : [{ status: 'NOT_APPLICABLE', message: unavailable }]
  const publishedSources = violationsOrPass(
    sources
      .filter((source) => !htmlPaths.has(source.htmlPath))
      .map((source) => ({
        status: 'VIOLATION' as const,
        message: 'No matching .html render exists; the artifact is unpublished.',
        subject: source.relativePath
      })),
    'Every artifact source has an HTML render.',
    unavailable
  )
  const orphanedRenders = violationsOrPass(
    [...htmlPaths]
      .filter((path) => !sources.some((source) => source.htmlPath === path))
      .map((path) => ({
        status: 'VIOLATION' as const,
        message: 'The .html render has no matching .md source.',
        subject: relative(root, path)
      })),
    'No orphaned HTML renders exist.',
    absent ? unavailable : undefined
  )
  const freshness = violationsOrPass(
    sources.flatMap((source) => {
      if (source.htmlMtimeMs === null) return []
      const difference = (source.mtimeMs - source.htmlMtimeMs) / (1000 * 60 * 60)
      return difference > configuration.thresholdHours
        ? [
            {
              status: 'VIOLATION' as const,
              message: `.html is ${Math.round(difference)}h behind .md (threshold: ${configuration.thresholdHours}h).`,
              subject: source.relativePath
            }
          ]
        : []
    }),
    'Every rendered pair is within the freshness threshold.',
    unavailable
  )
  const status = violationsOrPass(
    sources.flatMap((source) => {
      const value = source.frontmatter?.status
      if (!value)
        return [
          {
            status: 'VIOLATION' as const,
            message: "The required frontmatter field 'status' is absent.",
            subject: source.relativePath
          }
        ]
      return ['active', 'archived'].includes(value)
        ? []
        : [
            {
              status: 'VIOLATION' as const,
              message: `status '${value}' is not one of active / archived.`,
              subject: source.relativePath
            }
          ]
    }),
    'Every artifact source has a valid status.',
    unavailable
  )
  const renders = violationsOrPass(
    sources
      .filter(
        (source) =>
          !source.frontmatter?.renders
            ?.split(',')
            .map((value) => value.trim())
            .includes('html')
      )
      .map((source) => ({
        status: 'VIOLATION' as const,
        message: "The required frontmatter field 'renders' does not include html.",
        subject: source.relativePath
      })),
    'Every frontmatter block declares an HTML render.',
    unavailable
  )
  const author = violationsOrPass(
    sources
      .filter((source) => !source.frontmatter?.author)
      .map((source) => ({
        status: 'VIOLATION' as const,
        message: "The required frontmatter field 'author' is absent.",
        subject: source.relativePath
      })),
    'Every artifact source declares its owner.',
    unavailable
  )

  const mutable = mode === 'conform'
  const context: LiveArtifactsRubricContext = {
    rubric: { publication },
    structure: {
      index,
      publishedSources,
      orphanedRenders,
      freshness,
      ...(mutable && directoryExists && sources.length > 0 && indexSafe
        ? {
            ensureIndex: () => {
              const entry = (source: ArtifactSource): string =>
                `- [${source.stem}](${basename(source.relativePath)}) — _(description — see manual TODO)_`
              const current = drafts.get(indexRelativePath)
              if (current === null) {
                drafts.set(
                  indexRelativePath,
                  `# Live Artifacts\n\nOperational documents reflecting the current state of the island. Each row is a \`.md\`/\`.html\` pair.\n\n${sources.map(entry).join('\n')}\n`
                )
                return
              }
              if (current === undefined) return
              const missing = sources.filter(
                (source) => !current.includes(basename(source.relativePath)) && !current.includes(source.stem)
              )
              if (missing.length > 0)
                drafts.set(indexRelativePath, `${current.replace(/\n*$/, '\n')}${missing.map(entry).join('\n')}\n`)
            }
          }
        : {})
    },
    frontmatter: {
      status,
      renders,
      author,
      ...(mutable && missingRenders.length > 0
        ? {
            ensureRenders: () => {
              for (const source of missingRenders) drafts.set(source.relativePath, addRendersDeclaration(source.text))
            }
          }
        : {})
    }
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['LA', 'LA-F'], context: () => context }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      for (const [path, content] of drafts) {
        const original = originals.get(path)
        if (content === null || content === original) continue
        writes.push({ path, content, ...(original === null ? { create: true } : {}) })
      }
      return { writes }
    }
  }
}
