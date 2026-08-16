import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const CONFIG_FILE = '.ki-config.toml'
const CONFIG_SECTION = 'ki-repo-mcp'
const PACKAGE_FILE = 'package.json'
const MCP_MAIN = 'dist/mcp-server/index.js'
const FAMILY_CODES = ['KI', 'LAY', 'DOC', 'CFG', 'UTIL', 'TEST', 'TOOL', 'PKG', 'SCR', 'CI'] as const

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'
type ConfigState = 'missing' | 'unsafe' | 'malformed' | 'absent' | 'present'

type SourceFile = {
  readonly path: string
  readonly content: string
}

export type McpApplicabilityContext = {
  readonly root: string
  readonly rootExists: boolean
  readonly applicable: boolean
  readonly config: ConfigState
  readonly configKeys: readonly string[]
  readonly addMarker?: () => void
}

export type McpLayoutContext = {
  readonly requiredDirectories: readonly { readonly path: string; readonly state: NodeKind }[]
  readonly cli: {
    readonly state: NodeKind
    readonly files: readonly { readonly path: string; readonly state: NodeKind }[]
  }
}

export type McpDocumentationContext = {
  readonly documents: Readonly<Record<'ROADMAP.md' | 'CONTRIBUTING.md' | 'SECURITY.md' | 'CHANGELOG.md', string | null>>
}

export type McpConfigurationContext = {
  readonly source: string | null
  readonly ambientProcessEnvOffenders: readonly string[]
}

export type McpUtilitiesContext = {
  readonly files: readonly { readonly path: string; readonly present: boolean }[]
}

export type McpTestingContext = {
  readonly vitestFile: string | null
  readonly source: string | null
}

export type McpToolsContext = {
  readonly files: readonly SourceFile[]
  /** Every non-test source file, for checks whose subject can live outside `src/tools/`. */
  readonly resultFiles: readonly SourceFile[]
}

export type McpPackageContext = {
  readonly packageJson: Readonly<Record<string, unknown>> | null
  readonly malformed: boolean
  readonly conformPackage?: () => void
}

export type McpScriptsContext = {
  readonly packageJson: Readonly<Record<string, unknown>> | null
  readonly scripts: Readonly<Record<string, unknown>>
  readonly authServer: boolean
}

export type McpCiContext = {
  readonly scripts: Readonly<Record<string, unknown>>
  readonly workflow: string | null
}

export type McpRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly applicability: McpApplicabilityContext
  readonly layout: McpLayoutContext
  readonly documentation: McpDocumentationContext
  readonly configuration: McpConfigurationContext
  readonly utilities: McpUtilitiesContext
  readonly testing: McpTestingContext
  readonly tools: McpToolsContext
  readonly package: McpPackageContext
  readonly scripts: McpScriptsContext
  readonly ci: McpCiContext
}

const asTable = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const nodeKind = (path: string): NodeKind => {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return 'unsafe'
    if (stat.isFile()) return 'file'
    if (stat.isDirectory()) return 'directory'
    return 'unsafe'
  } catch {
    return 'missing'
  }
}

const containedPath = (root: string, path: string): string | undefined => {
  const value = relative(root, path)
  return value && !isAbsolute(value) && value !== '..' && !value.startsWith('../') ? value : undefined
}

const sourceFilesBelow = (root: string, directory: string): SourceFile[] => {
  if (nodeKind(directory) !== 'directory') return []
  const files: SourceFile[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...sourceFilesBelow(root, path))
    else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const relativePath = containedPath(root, path)
      if (relativePath) files.push({ path: relativePath, content: readFileSync(path, 'utf8') })
    }
  }
  return files.sort((left, right) => left.path.localeCompare(right.path))
}

const inspectConfig = (
  path: string,
  kind: NodeKind
): { readonly state: ConfigState; readonly keys: readonly string[]; readonly content: string | null } => {
  if (kind === 'missing') return { state: 'missing', keys: [], content: null }
  if (kind !== 'file') return { state: 'unsafe', keys: [], content: null }
  const content = readFileSync(path, 'utf8')
  try {
    const document = Bun.TOML.parse(content) as Record<string, unknown>
    const table = asTable(asTable(document.skills)?.[CONFIG_SECTION])
    return table ? { state: 'present', keys: Object.keys(table), content } : { state: 'absent', keys: [], content }
  } catch {
    return { state: 'malformed', keys: [], content }
  }
}

const inspectPackage = (
  path: string,
  kind: NodeKind
): { readonly value: Record<string, unknown> | null; readonly malformed: boolean; readonly content: string | null } => {
  if (kind === 'missing') return { value: null, malformed: false, content: null }
  if (kind !== 'file') return { value: null, malformed: true, content: null }
  const content = readFileSync(path, 'utf8')
  try {
    return { value: JSON.parse(content) as Record<string, unknown>, malformed: false, content }
  } catch {
    return { value: null, malformed: true, content }
  }
}

const packageScripts = (value: Record<string, unknown> | null): Record<string, unknown> => asTable(value?.scripts) ?? {}

/**
 * Strip comments from one source line, carrying block-comment state across lines.
 *
 * A per-line `//` test cannot see a block comment: a JSDoc continuation line reads as bare code, so
 * prose describing `process.env` is indistinguishable from a real read. String literals are tracked
 * so a `//` inside one (a URL, say) does not truncate the rest of the line.
 */
const stripComments = (line: string, state: { inBlock: boolean }): string => {
  let code = ''
  let quote: string | null = null
  let index = 0
  while (index < line.length) {
    const character = line[index]
    if (state.inBlock) {
      if (line.startsWith('*/', index)) {
        state.inBlock = false
        index += 2
        continue
      }
      index += 1
      continue
    }
    if (quote) {
      if (character === '\\') {
        index += 2
        continue
      }
      if (character === quote) quote = null
      code += character
      index += 1
      continue
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character
      code += character
      index += 1
      continue
    }
    if (line.startsWith('//', index)) break
    if (line.startsWith('/*', index)) {
      state.inBlock = true
      index += 2
      continue
    }
    code += character
    index += 1
  }
  return code
}

export const createMcpSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<McpRubricContext> => {
  const root = resolve(repository)
  const rootExists = nodeKind(root) === 'directory'
  const at = (...parts: string[]): string => join(root, ...parts)
  const sourceFiles = rootExists ? sourceFilesBelow(root, at('src')) : []
  const sourceByPath = new Map(sourceFiles.map((file) => [file.path, file.content]))
  const configPath = at(CONFIG_FILE)
  const configEvidence = rootExists
    ? inspectConfig(configPath, nodeKind(configPath))
    : { state: 'missing' as const, keys: [], content: null }
  const applicable = rootExists && configEvidence.state === 'present'
  const packagePath = at(PACKAGE_FILE)
  const packageEvidence = rootExists
    ? inspectPackage(packagePath, nodeKind(packagePath))
    : { value: null, malformed: false, content: null }
  const scripts = packageScripts(packageEvidence.value)
  const originalPackage = packageEvidence.value
  const packageDraft = originalPackage ? structuredClone(originalPackage) : null
  let packageChanged = false
  const regularDocument = (file: 'ROADMAP.md' | 'CONTRIBUTING.md' | 'SECURITY.md' | 'CHANGELOG.md'): string | null =>
    nodeKind(at(file)) === 'file' ? readFileSync(at(file), 'utf8') : null
  const vitestFile =
    [
      'vitest.config.ts',
      'vitest.config.js',
      'vitest.config.mts',
      'vitest.config.cts',
      'vitest.config.mjs',
      'vitest.config.cjs'
    ].find((file) => nodeKind(at(file)) === 'file') ?? null
  const toolFiles = sourceFiles.filter((file) => file.path.startsWith('src/tools/') && !file.path.endsWith('.test.ts'))
  // Envelope helpers are not always reached from `src/tools/`: a server may build its result in
  // `main/` or share a `jsonResult` in `utils/`, so scoping the structured-output scan to the tool
  // layer reports a conformant surface for a repo that never declares an `outputSchema` at all.
  const resultFiles = sourceFiles.filter((file) => !file.path.endsWith('.test.ts'))

  const context: McpRubricContext = {
    rubric: { publication },
    applicability: {
      root,
      rootExists,
      applicable,
      config: configEvidence.state,
      configKeys: configEvidence.keys
    },
    layout: {
      requiredDirectories: ['config', 'mcp-server', 'tools', 'main', 'utils'].map((directory) => ({
        path: `src/${directory}`,
        state: nodeKind(at('src', directory))
      })),
      cli: {
        state: nodeKind(at('src', 'cli')),
        files: ['cli.ts', 'index.ts'].map((file) => ({
          path: `src/cli/${file}`,
          state: nodeKind(at('src', 'cli', file))
        }))
      }
    },
    documentation: {
      documents: {
        'ROADMAP.md': regularDocument('ROADMAP.md'),
        'CONTRIBUTING.md': regularDocument('CONTRIBUTING.md'),
        'SECURITY.md': regularDocument('SECURITY.md'),
        'CHANGELOG.md': regularDocument('CHANGELOG.md')
      }
    },
    configuration: {
      source: sourceByPath.get('src/config/index.ts') ?? null,
      ambientProcessEnvOffenders: sourceFiles
        .filter(
          (file) =>
            !file.path.startsWith('src/config/') &&
            !file.path.endsWith('.test.ts') &&
            file.path !== 'src/mcp-server/index.ts' &&
            file.path !== 'src/cli/cli.ts'
        )
        .filter((file) => {
          const state = { inBlock: false }
          return file.content.split('\n').some((line) => {
            const code = stripComments(line, state)
            if (!code.includes('process.env')) return false
            return !/(?:=\s*|\.\.\.)process\.env(?![\w.[])/.test(code)
          })
        })
        .map((file) => file.path)
    },
    utilities: {
      files: ['access-level.ts', 'annotations.ts', 'audit-log.ts'].map((file) => ({
        path: `src/utils/${file}`,
        present: sourceByPath.has(`src/utils/${file}`)
      }))
    },
    testing: {
      vitestFile,
      source: vitestFile ? readFileSync(at(vitestFile), 'utf8') : null
    },
    tools: { files: toolFiles, resultFiles },
    package: {
      packageJson: originalPackage,
      malformed: packageEvidence.malformed,
      ...(mode === 'conform' && applicable && packageDraft
        ? {
            conformPackage: () => {
              if (!packageDraft) return
              const bin = asTable(packageDraft.bin) ?? {}
              const exports_ = asTable(packageDraft.exports) ?? {}
              if (packageDraft.main !== MCP_MAIN) {
                packageDraft.main = MCP_MAIN
                packageChanged = true
              }
              if (!Object.values(bin).includes(MCP_MAIN)) {
                const names = Object.keys(bin)
                bin[
                  names.length === 1
                    ? (names[0] as string)
                    : String(packageDraft.name ?? 'mcp-server').replace(/^@[^/]+\//, '')
                ] = MCP_MAIN
                packageDraft.bin = bin
                packageChanged = true
              }
              for (const [key, value] of Object.entries({
                '.': { types: './dist/index.d.ts', default: `./${MCP_MAIN}` },
                './config': { types: './dist/config/index.d.ts', default: './dist/config/index.js' },
                './package.json': './package.json'
              }))
                if (exports_[key] === undefined) {
                  exports_[key] = value
                  packageChanged = true
                }
              packageDraft.exports = exports_
            }
          }
        : {})
    },
    scripts: {
      packageJson: originalPackage,
      scripts,
      authServer: nodeKind(at('src', 'auth-server')) === 'directory'
    },
    ci: {
      scripts,
      workflow:
        nodeKind(at('.github', 'workflows', 'ci.yml')) === 'file'
          ? readFileSync(at('.github', 'workflows', 'ci.yml'), 'utf8')
          : null
    }
  }

  return {
    subjects: [
      { families: applicable ? FAMILY_CODES : ['KI'], context: () => context },
      { families: ['RUBRIC'], context: () => context, subject: root }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (packageChanged && packageDraft && packageEvidence.content !== null)
        writes.push({ path: PACKAGE_FILE, content: `${JSON.stringify(packageDraft, null, 2)}\n` })
      return { writes }
    }
  }
}
