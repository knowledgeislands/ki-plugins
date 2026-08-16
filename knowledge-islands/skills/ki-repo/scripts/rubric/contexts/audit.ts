/**
 * Read-only domain evidence collection for the Knowledge Islands repo rubric.
 *
 * A physical checkout is the primary source for repository files, configuration,
 * tree coverage, and package metadata. A remote `--org` run has no filesystem and
 * reads those same surfaces from the GitHub default branch. Live repository settings
 * always come from GitHub through `gh`. The tree path / `--org` decide which mode
 * applies; a local target never silently falls back to remote file evidence.
 *
 * The standard has three layers (see references/standards-repository.md):
 *   1. FILES   — README, LICENSE, .gitignore, and .ki-config.toml
 *                (the repo's declared config), from the selected evidence source.
 *                .ki-config.toml is also the GATE of the coverage cascade: once a
 *                repo is confirmed a ki-repo by carrying it, each other governance
 *                skill whose applicability is detectable in the repo (a Streams/
 *                zone, an eleventy.config, an MCP SDK dep, …) must DECLARE its
 *                `[skills.ki-<skill>]` opt-in table — detected-but-undeclared
 *                WARNs. A non-ki-repo is never coverage-checked (no false positives).
 *   2. GITHUB  — default branch, license, squash-only + linear, auto-delete-branch,
 *                Issues on / Wiki+Projects off, non-empty description, visibility
 *                (matches the value DECLARED in .ki-config.toml — not the name),
 *                and (public) the standard topic set. `main` is open by default;
 *                branch protection is an overridable check (.ki-config.toml checks).
 *   3. DEEPER  — Dependabot alerts + security updates; "always suggest updating PR
 *                branches" (allow_update_branch); secret scanning + push protection
 *                (public); Actions allowed-actions = all.
 *
 * Each repo's `.ki-config.toml` declares its `visibility` and, in a
 * `[skills.ki-repo.checks]` sub-table, per-repo overrides — one
 * boolean per overridable check (`true` = enforce, `false` = don't). A check it
 * omits takes the org default (CHECK_DEFAULTS), so a fully-conforming repo writes
 * no overrides; `branch-protection` defaults off, so `main` is open unless opted in.
 *
 * READ-ONLY: never mutates a repo. The one remaining judgment item the collector
 * cannot make — does the description
 * actually match the repo's purpose — is left to the skill's AUDIT mode; that it is
 * SYNCED with package.json is now checked mechanically (description-sync).
 *
 * `gh` is optional: unauthenticated and unavailable GitHub checks become
 * NOT_APPLICABLE evidence while offline local checks still run. The host owns
 * outcome validation, finding conversion, progress, and reporting.
 */
import { execFile, execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import type { RubricEmitter } from '../../shared/rubric.ts'

// ── the standard (keep in sync with references/standards-repository.md) ──────
const DEFAULT_BRANCH = 'main'
// The declared license defaults to MIT when `[skills.ki-repo] license` is unset. Decoupled
// from visibility (a private repo may be MIT; a public repo may be proprietary).
const DEFAULT_LICENSE = 'MIT'
const TOPICS = ['mcp', 'model-context-protocol', 'claude', 'typescript', 'bun']
const REQUIRED_CHECK = 'build'
const ALLOWED_ACTIONS = 'all'
// Reference-doc pointer carried on every mechanical finding.
const STD = 'references/standards-repository.md'
// Overridable checks and the org default for each — `true` = enforced by default.
// A repo overrides any of these per-repo in [skills.ki-repo.checks];
// a check it omits takes the default here, so a fully-conforming repo writes none.
// (The other checks — file presence, default branch, license, description, merge,
// delete-branch, visibility, Dependabot — are bedrock: always enforced, no override.)
// `branch-protection` defaults OFF, so `main` is open unless a repo opts in.
const CHECK_DEFAULTS: Record<string, boolean> = {
  'branch-protection': false, // protect `main` (PR + build check + linear history)
  wiki: true, //                Wiki disabled
  projects: true, //            Projects disabled
  issues: true, //              Issues enabled
  topics: true, //              (public) carries the standard topic set
  'secret-scanning': true, //   (public) secret scanning on
  'push-protection': true, //   (public) secret-scanning push protection on
  structure: true //            declares one primary repository structure
}
const KI_CONFIG = '.ki-config.toml'

// Required root files. Each entry is one or more acceptable paths (first found wins).
const REQUIRED_FILES: [id: string, paths: string[]][] = [
  ['readme', ['README.md']],
  ['license-file', ['LICENSE', 'LICENSE.md']],
  ['gitignore', ['.gitignore']],
  ['editorconfig', ['.editorconfig']],
  ['claude-md', ['CLAUDE.md']],
  ['ki-config', [KI_CONFIG]]
]

// `note` is informational (a per-repo override in effect), never a failure.
// Domain evidence levels; the rubric item maps these to typed host outcomes.
type Level = 'FAIL' | 'WARN' | 'INFO' | 'NOT_APPLICABLE' | 'PASS'
// Cited-finding shape: `area` is the rubric code (references/rubric.md), `ref` the
// reference-doc pointer (defaults to the standard STD; the rare judgment finding overrides
// it), `file` the in-repo path a file-scoped finding concerns. Arg order (area, msg, file?,
// ref?) puts the often-set `file` before the usually-defaulted `ref`, so most call sites
// stay two-arg. Matches ki-authoring's Finding shape.
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
export type RepoEvidenceLevel = Level
export type RepoEvidenceFinding = { level: RepoEvidenceLevel; code: string; message: string; subject?: string }
const mk = () => {
  const f: Finding[] = []
  const push =
    (level: Level) =>
    (area: string, msg: string, file?: string, ref: string = STD): void =>
      void f.push({ level, area, msg, ref, file })
  return {
    f,
    fail: push('FAIL'),
    warn: push('WARN'),
    note: push('INFO')
  }
}

// Awaited rather than synchronous: every call here is a network round trip to GitHub, and
// they are the longest blocking spans in the estate. Held synchronous they starve the host's
// progress refresh for the whole run, leaving a live audit indistinguishable from a hang.
const run = promisify(execFile)

// Reports each network round trip as it is made, so a run that is waiting on GitHub says so.
// Set for the duration of a collection and cleared after it; unset means no host is watching.
let ghEmit: RubricEmitter | undefined

async function gh(args: string[]): Promise<string> {
  ghEmit?.({ kind: 'step', label: `gh ${args[0] === 'api' ? (args[1] ?? 'api') : args.join(' ')}` })
  const { stdout } = await run('gh', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  return stdout
}
// gh authentication is a precondition for every GitHub-touching check. In CI there is
// no token (the workflow runs this gate for its offline vendor-integrity value only —
// see ci.yml), so an unauthenticated `gh` must degrade the GitHub checks to a skip, not
// hard-FAIL. Cached: `gh auth status` is one process, and auth does not change mid-run.
let ghAuthedCache: boolean | null = null
async function ghAuthed(): Promise<boolean> {
  if (ghAuthedCache === null) {
    try {
      await run('gh', ['auth', 'status'])
      ghAuthedCache = true
    } catch {
      ghAuthedCache = false
    }
  }
  return ghAuthedCache
}
const ghOk = async (apiPath: string): Promise<boolean> => {
  try {
    await gh(['api', apiPath])
    return true
  } catch {
    return false
  }
}
const ghJSON = async (apiPath: string): Promise<unknown> => JSON.parse(await gh(['api', apiPath]))
// File content as raw text, or null on 404.
const ghRaw = async (nwo: string, path: string): Promise<string | null> => {
  try {
    return await gh(['api', `repos/${nwo}/contents/${path}`, '-H', 'Accept: application/vnd.github.raw'])
  } catch {
    return null
  }
}
// Set of the repo's root-level paths (one call), for presence checks.
async function rootPaths(nwo: string, branch: string): Promise<Set<string>> {
  try {
    const t = (await ghJSON(`repos/${nwo}/git/trees/${branch}`)) as { tree?: { path: string }[] }
    return new Set((t.tree ?? []).map((e) => e.path))
  } catch {
    return new Set()
  }
}

const topicNames = (t: unknown): string[] =>
  Array.isArray(t) ? t.map((x) => (typeof x === 'string' ? x : (x?.name ?? x?.topic?.name))).filter(Boolean) : []

// The repo's parsed package.json (or null if absent / unparseable), read once from
// the selected local checkout or GitHub default branch and reused for the
// description-sync check and the MCP-dependency coverage signal.
type Pkg = {
  name?: unknown
  version?: unknown
  description?: unknown
  author?: unknown
  license?: unknown
  private?: unknown
  repository?: unknown
  homepage?: unknown
  bugs?: unknown
  keywords?: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
function parsePkg(text: string | null): Pkg | null {
  if (text == null) return null
  try {
    return JSON.parse(text) as Pkg
  } catch {
    return null
  }
}
async function readRemotePkg(nwo: string, files: Set<string>): Promise<Pkg | null> {
  return files.has('package.json') ? parsePkg(await ghRaw(nwo, 'package.json')) : null
}
// package.json `description` (the in-repo source of truth the GitHub description must
// be SYNCED with), or null when there is none / it isn't a non-empty string.
const pkgDescription = (pkg: Pkg | null): string | null =>
  typeof pkg?.description === 'string' && pkg.description.trim() ? pkg.description.trim() : null
// Does package.json declare `name` among its dependencies or devDependencies?
const pkgHasDep = (pkg: Pkg | null, name: string): boolean =>
  Boolean(pkg?.dependencies?.[name] ?? pkg?.devDependencies?.[name])

// The repo's full tree (recursive) as a set of paths, for the coverage signals that
// look below the root (`site/wrangler.jsonc`, `skills/*/SKILL.md`, runtime subagent projections).
// One API call; empty set on error or truncation. `rootPaths` stays the top-level
// view the file-presence checks use.
async function treePaths(nwo: string, branch: string): Promise<Set<string>> {
  try {
    const t = (await ghJSON(`repos/${nwo}/git/trees/${branch}?recursive=1`)) as { tree?: { path: string }[] }
    return new Set((t.tree ?? []).map((e) => e.path))
  } catch {
    return new Set()
  }
}

// A local audit reads the checkout's current repository content. `git ls-files`
// covers tracked, staged, and untracked non-ignored paths without traversing
// dependency directories or `.git`; it is deliberately not a GitHub fallback.
export function localTreePaths(dir: string): Set<string> {
  const output = execFileSync('git', ['-C', dir, 'ls-files', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  return new Set(output.split(/\r?\n/).filter(Boolean))
}

const localRootPaths = (tree: ReadonlySet<string>): Set<string> =>
  new Set([...tree].map((path) => path.split('/')[0]).filter((path): path is string => Boolean(path)))

const localRaw = (dir: string, path: string): string | null => {
  try {
    return readFileSync(join(dir, path), 'utf8')
  } catch {
    return null
  }
}

// `.ki-config.toml` is a shared per-repo file; each skill reads its own [table].
// This skill owns the [skills.ki-repo] table. The default block
// (written by `--educate`) is the authoritative key list — authoring a repo emits it.
// A declaration is a bare skill name under `[skills]`; the providing harness is resolved from
// `[repo] harnesses` rather than repeated in every key.
const skillTable = (name: string): string => name
/** The declared skill tables, or an empty map where the file declares none. */
const declaredSkills = (document: Record<string, unknown>): Record<string, unknown> => {
  const skills = document.skills
  return skills && typeof skills === 'object' && !Array.isArray(skills) ? (skills as Record<string, unknown>) : {}
}
const KI_SECTION = skillTable('ki-repo')
const KI_REPO_DEFAULT = `[skills.${KI_SECTION}]
repository = ""         # required — canonical HTTPS GitHub home, for example https://github.com/owner/repository
title = ""              # required — exact README.md H1
description = ""        # required — exact GitHub and package.json description where present
visibility = "private"   # "public" | "private" — must match the repo's actual GitHub visibility
license = "MIT"          # SPDX id the LICENSE, package.json, and GitHub must match; default MIT. Use "UNLICENSED" for proprietary. Pick one at https://choosealicense.com/
supported_runtimes = ["claude-code", "chatgpt-codex"] # required agent-runtime support surface

# Per-repo check overrides — true = enforce, false = don't. Omit any check to take
# the org default; a repo that fully conforms needs nothing here.
# [skills.${KI_SECTION}.checks]
# branch-protection = true   # default off — protect \`main\` on this repo
# wiki = false               # default on  — allow this repo's Wiki
`

const KI_AUTHORING_DEFAULT = `# The authoring standard (Markdown/TOML house style) is baseline — every KI repo is
# governed by it. Declared explicitly, not assumed; its presence is the compliance marker.
[skills.${skillTable('ki-authoring')}]
`
const KI_DEFAULT = `${KI_REPO_DEFAULT}\n${KI_AUTHORING_DEFAULT}`

// Parse the owned table with Bun's TOML parser so quoted table keys, comments,
// and multiline strings cannot be mistaken for schema. Returns null when the
// document is invalid or has no object-valued [skills.ki-repo] table.
type KiConfig = {
  repository?: string
  title?: string
  description?: string
  repoCode?: string
  visibility?: string
  license?: string
  checks: Record<string, boolean>
}
export type RepositoryType = 'repository' | 'kb'
export type RepositoryConfiguration = {
  repositoryType: RepositoryType
  storeRoles: readonly string[]
  rootTables: readonly string[]
  issue?: string
}
const REPOSITORY_TYPES = new Set<RepositoryType>(['repository', 'kb'])
const KB_STORE_ROLES = ['notes', 'sources', 'legacy'] as const
const GITHUB_REPOSITORY =
  /^https:\/\/github\.com\/([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)\/([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)$/
const CHECKS_SECTION = `${KI_SECTION}.checks`
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML
function parseKiConfig(text: string): KiConfig | null {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
  const value = declaredSkills(document)[KI_SECTION]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const table = value as Record<string, unknown>
  const out: KiConfig = { checks: {} }
  if (typeof table.repository === 'string') out.repository = table.repository
  if (typeof table.title === 'string') out.title = table.title
  if (typeof table.description === 'string') out.description = table.description
  if (typeof table.repo_code === 'string') out.repoCode = table.repo_code
  if (typeof table.visibility === 'string') out.visibility = table.visibility
  if (typeof table.license === 'string') out.license = table.license
  if (table.checks && typeof table.checks === 'object' && !Array.isArray(table.checks)) {
    for (const [key, check] of Object.entries(table.checks as Record<string, unknown>)) {
      if (typeof check === 'boolean') out.checks[key] = check
    }
  }
  return out
}

/**
 * Parse the portable repository-kind contract owned by ki-repo.  A repository
 * that omits `repo_type` is an ordinary repository; the only specialised
 * operating model is a Knowledge Base (`kb`).  Store roles are identities, not
 * paths: `notes` names the KB repository itself and external bindings stay in
 * user-local tooling.
 */
export function parseRepositoryConfiguration(text: string): RepositoryConfiguration {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(text) as Record<string, unknown>
  } catch {
    return { repositoryType: 'repository', storeRoles: [], rootTables: [], issue: 'must be valid TOML' }
  }
  const rootTables = Object.entries(declaredSkills(document))
    .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
    .map(([name]) => name)
  const value = declaredSkills(document)[KI_SECTION]
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return {
      repositoryType: 'repository',
      storeRoles: [],
      rootTables,
      issue: `must contain a [skills.${KI_SECTION}] table`
    }
  const table = value as Record<string, unknown>
  const rawType = table.repo_type
  if (rawType !== undefined && (typeof rawType !== 'string' || !REPOSITORY_TYPES.has(rawType as RepositoryType)))
    return {
      repositoryType: 'repository',
      storeRoles: [],
      rootTables,
      issue: `repo_type must be one of: ${[...REPOSITORY_TYPES].join(', ')}`
    }
  const repositoryType = (rawType ?? 'repository') as RepositoryType
  const rawRoles = table.store_roles
  if (rawRoles === undefined) {
    if (repositoryType === 'kb')
      return { repositoryType, storeRoles: [], rootTables, issue: 'KB repo_type requires store_roles including notes' }
    return { repositoryType, storeRoles: [], rootTables }
  }
  if (!Array.isArray(rawRoles) || rawRoles.some((role) => typeof role !== 'string'))
    return { repositoryType, storeRoles: [], rootTables, issue: 'store_roles must be an array of role names' }
  const storeRoles = rawRoles as string[]
  if (new Set(storeRoles).size !== storeRoles.length)
    return { repositoryType, storeRoles, rootTables, issue: 'store_roles must not repeat a role' }
  const unknown = storeRoles.filter((role) => !(KB_STORE_ROLES as readonly string[]).includes(role))
  if (unknown.length)
    return {
      repositoryType,
      storeRoles,
      rootTables,
      issue: `store_roles names unknown role(s): ${unknown.join(', ')} (known: ${KB_STORE_ROLES.join(', ')})`
    }
  if (repositoryType !== 'kb' && storeRoles.length)
    return { repositoryType, storeRoles, rootTables, issue: 'store_roles is only valid when repo_type is kb' }
  if (repositoryType === 'kb' && !storeRoles.includes('notes'))
    return { repositoryType, storeRoles, rootTables, issue: 'KB store_roles must include notes' }
  return { repositoryType, storeRoles, rootTables }
}

type Repo = {
  nameWithOwner: string
  visibility: 'PUBLIC' | 'PRIVATE'
  isArchived: boolean
  defaultBranchRef: { name: string } | null
  mergeCommitAllowed: boolean
  squashMergeAllowed: boolean
  rebaseMergeAllowed: boolean
  deleteBranchOnMerge: boolean
  hasIssuesEnabled: boolean
  hasProjectsEnabled: boolean
  hasWikiEnabled: boolean
  repositoryTopics: unknown
  licenseInfo: { key: string } | null
  description: string
}
const REPO_FIELDS =
  'nameWithOwner,visibility,isArchived,defaultBranchRef,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed,deleteBranchOnMerge,hasIssuesEnabled,hasProjectsEnabled,hasWikiEnabled,repositoryTopics,licenseInfo,description'

// ── coverage cascade ──────────────────────────────────────────────────────────
// Once the gate confirms a repo is a ki-repo (it carries .ki-config.toml), each
// other governance skill whose APPLICABILITY is detectable from the repo must be
// DECLARED — its `[skills.ki-<skill>]` opt-in table present. This is the
// single registry of {skill → detection signal → opt-in table}. `repo` reads only
// table PRESENCE here (validate-down still owns table CONTENTS); a detected-but-
// undeclared signal WARNs, a declared-but-undetected table WARNs as possibly stale.
// `authoring` is baseline (every KI repo) and so is not a *detected* coverage signal —
// it is checked directly as a required declaration above (authoring-baseline), not here.
const WRANGLER = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml']
const ELEVENTY = ['eleventy.config.ts', 'eleventy.config.js', 'eleventy.config.cjs', 'eleventy.config.mjs']
const VITE = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts']
type Signals = { root: Set<string>; tree: Set<string>; pkg: Pkg | null }

const hasNamedConfig = (signals: Signals, names: readonly string[]): boolean =>
  names.some((file) => signals.root.has(file)) ||
  [...signals.tree].some((path) => names.some((file) => path.endsWith(`/${file}`)))

const hasContentWebsite = (signals: Signals): boolean => hasNamedConfig(signals, ELEVENTY)
const hasAppWebsite = (signals: Signals): boolean =>
  hasNamedConfig(signals, VITE) && pkgHasDep(signals.pkg, 'react') && pkgHasDep(signals.pkg, 'vite')
type ContentSource = 'local checkout' | 'GitHub default branch'
type ContentEvidence = {
  files: Set<string>
  kiText: string | null
  ki: KiConfig | null
  readme: string | null
  gitignore: string | null
  signals: Signals
  source: ContentSource
}

function localContentEvidence(dir: string): ContentEvidence {
  const tree = localTreePaths(dir)
  const files = localRootPaths(tree)
  const kiText = files.has(KI_CONFIG) ? localRaw(dir, KI_CONFIG) : null
  return {
    files,
    kiText,
    ki: kiText == null ? null : parseKiConfig(kiText),
    readme: files.has('README.md') ? localRaw(dir, 'README.md') : null,
    gitignore: files.has('.gitignore') ? localRaw(dir, '.gitignore') : null,
    signals: { root: files, tree, pkg: files.has('package.json') ? parsePkg(localRaw(dir, 'package.json')) : null },
    source: 'local checkout'
  }
}

async function remoteContentEvidence(nwo: string, branch: string): Promise<ContentEvidence> {
  const files = await rootPaths(nwo, branch)
  const kiText = files.has(KI_CONFIG) ? await ghRaw(nwo, KI_CONFIG) : null
  // Independent round trips, so they overlap rather than queue: the content reads do not
  // depend on one another, and the tree call is the slowest of them.
  const [readme, gitignore, tree, pkg] = await Promise.all([
    files.has('README.md') ? ghRaw(nwo, 'README.md') : null,
    files.has('.gitignore') ? ghRaw(nwo, '.gitignore') : null,
    treePaths(nwo, branch),
    readRemotePkg(nwo, files)
  ])
  return {
    files,
    kiText,
    ki: kiText == null ? null : parseKiConfig(kiText),
    readme,
    gitignore,
    signals: { root: files, tree, pkg },
    source: 'GitHub default branch'
  }
}

const COVERAGE: { skill: string; table: string; artifact: string; detect: (s: Signals) => boolean }[] = [
  {
    skill: 'engineering',
    table: skillTable('ki-engineering'),
    artifact: 'package.json',
    detect: (s) => s.root.has('package.json')
  },
  {
    skill: 'kb',
    table: skillTable('ki-repo-kb'),
    artifact: 'KB zones (Pillars/ + Resources/)',
    detect: (s) => s.root.has('Pillars') && s.root.has('Resources')
  },
  {
    skill: 'streams',
    table: skillTable('ki-repo-kb-streams'),
    artifact: 'Streams/ zone',
    detect: (s) => s.root.has('Streams')
  },
  {
    skill: 'website',
    table: skillTable('ki-repo-website'),
    artifact: 'a content or app website implementation',
    detect: (s) => hasContentWebsite(s) || hasAppWebsite(s)
  },
  {
    skill: 'website-content',
    table: skillTable('ki-repo-website-content'),
    artifact: 'eleventy.config.*',
    detect: hasContentWebsite
  },
  {
    skill: 'website-app',
    table: skillTable('ki-repo-website-app'),
    artifact: 'Vite config with React and Vite dependencies',
    detect: hasAppWebsite
  },
  {
    skill: 'website-cloudflare',
    table: skillTable('ki-repo-website-cloudflare'),
    artifact: 'wrangler config',
    detect: (s) =>
      WRANGLER.some((f) => s.root.has(f)) || [...s.tree].some((p) => WRANGLER.some((f) => p.endsWith(`/${f}`)))
  },
  {
    skill: 'mcp',
    table: skillTable('ki-repo-mcp'),
    artifact: '@modelcontextprotocol/sdk dependency',
    detect: (s) => pkgHasDep(s.pkg, '@modelcontextprotocol/sdk')
  },
  {
    skill: 'plugins',
    table: skillTable('ki-repo-plugins'),
    artifact: '.claude-plugin/marketplace.json',
    detect: (s) =>
      s.tree.has('.claude-plugin/marketplace.json') ||
      [...s.tree].some((p) => p.endsWith('/.claude-plugin/marketplace.json'))
  },
  {
    skill: 'specifications',
    table: skillTable('ki-repo-specifications'),
    artifact: 'proposals/ + specifications/ + schemas/',
    detect: (s) => s.root.has('proposals') && s.root.has('specifications') && s.root.has('schemas')
  },
  {
    skill: 'tools',
    table: skillTable('ki-repo-tools'),
    artifact: 'install.sh + bin/<exe>',
    detect: (s) => s.root.has('install.sh') && [...s.tree].some((p) => /^bin\/[^/]+$/.test(p))
  },
  {
    skill: 'homebrew-tap',
    table: skillTable('ki-repo-homebrew-tap'),
    artifact: 'Formula/*.rb',
    detect: (s) => [...s.tree].some((p) => /^Formula\/[^/]+\.rb$/.test(p))
  },
  {
    skill: 'skills',
    table: skillTable('ki-skills'),
    artifact: 'skills/**/SKILL.md',
    detect: (s) => [...s.tree].some((p) => /^skills\/.+\/SKILL\.md$/.test(p))
  },
  {
    skill: 'subagents',
    table: skillTable('ki-subagents'),
    artifact: 'subagents/**/*.md or .codex/agents/**/*.toml',
    detect: (s) =>
      [...s.tree].some(
        (p) => (/^subagents\/.+\.md$/.test(p) && !/(^|\/)README\.md$/i.test(p)) || /^\.codex\/agents\/.+\.toml$/.test(p)
      )
  },
  {
    skill: 'subagents-claude',
    table: skillTable('ki-subagents-claude'),
    artifact: 'subagents/**/*.md',
    detect: (s) => [...s.tree].some((p) => /^subagents\/.+\.md$/.test(p) && !/(^|\/)README\.md$/i.test(p))
  },
  {
    skill: 'subagents-codex',
    table: skillTable('ki-subagents-codex'),
    artifact: '.codex/agents/**/*.toml',
    detect: (s) => [...s.tree].some((p) => /^\.codex\/agents\/.+\.toml$/.test(p))
  },
  {
    skill: 'checkpoint',
    table: skillTable('ki-checkpoint'),
    artifact: '+/_CHECKPOINTS/ subarea',
    detect: (s) => [...s.tree].some((p) => p.startsWith('+/_CHECKPOINTS/'))
  }
]
const COVERAGE_SKILLS = new Set(COVERAGE.map((c) => c.skill))
// A primary structure is exclusive; all other ki-repo-* skills are composable
// specialisations. Project is the non-KB default, while KB owns the KB primary.
const PRIMARY_STRUCTURE_TABLES = [skillTable('ki-repo-project'), skillTable('ki-repo-kb')]
const WEBSITE_IMPLEMENTATION_TABLES = [skillTable('ki-repo-website-content'), skillTable('ki-repo-website-app')]
type MultilineDelimiter = '"""' | "'''"
function tripleClose(line: string, delimiter: MultilineDelimiter, from: number): number {
  let at = line.indexOf(delimiter, from)
  while (at !== -1) {
    const backslashes = line.slice(0, at).match(/\\+$/)?.[0].length ?? 0
    if (delimiter === "'''" || backslashes % 2 === 0) return at
    at = line.indexOf(delimiter, at + delimiter.length)
  }
  return -1
}

function declaredTables(text: string): Array<{ root: string; exact: boolean }> {
  const tables: Array<{ root: string; exact: boolean }> = []
  let multiline: MultilineDelimiter | null = null
  for (const raw of text.split(/\r?\n/)) {
    if (multiline) {
      if (tripleClose(raw, multiline, 0) !== -1) multiline = null
      continue
    }
    let code = ''
    let quote: '"' | "'" | null = null
    let escaped = false
    for (let i = 0; i < raw.length; i++) {
      const delimiter = raw.startsWith('"""', i) ? '"""' : raw.startsWith("'''", i) ? "'''" : null
      if (!quote && delimiter) {
        if (tripleClose(raw, delimiter, i + delimiter.length) === -1) multiline = delimiter
        break
      }
      const char = raw[i] as string
      if (!quote && char === '#') break
      code += char
      if (quote === '"') {
        if (!escaped && char === '"') quote = null
        escaped = !escaped && char === '\\'
      } else if (quote === "'") {
        if (char === "'") quote = null
      } else if (char === '"' || char === "'") {
        quote = char
        escaped = false
      }
    }
    // A declaration is the key beneath `[skills]`; the namespace itself is not a declared table, so
    // a header that names anything else (`[repo]`, say) contributes nothing here.
    const match = code.trim().match(/^\[\s*skills\s*\.\s*(?:"([^"\\]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*(\.|\])/)
    const root = match?.[1] ?? match?.[2] ?? match?.[3]
    if (root) tables.push({ root, exact: match?.[4] === ']' })
  }
  return tables
}

const declaresTable = (kiText: string, table: string): boolean =>
  declaredTables(kiText).some(({ root }) => root === table)
export const declaresRootTable = (kiText: string, table: string): boolean =>
  declaredTables(kiText).some(({ root, exact }) => root === table && exact)

const readmeTitle = (text: string | null): string | null =>
  text?.match(/^#\s+(.+?)(?:\s+#+)?\s*$/m)?.[1]?.trim() || null

const RUNTIME_SKILL_IGNORE_RULES = [
  '.claude/skills/*',
  '.agents/skills/*',
  '!.agents/skills/ki-self/',
  '!.agents/skills/ki-self/**'
]

function hasRuntimeSkillIgnoreRules(gitignore: string | null, expected: readonly string[]): boolean {
  if (gitignore == null) return false
  const lines = gitignore.split(/\r?\n/).map((line) => line.trim())
  const actual = lines.filter((line) => RUNTIME_SKILL_IGNORE_RULES.includes(line))
  return (
    actual.length === expected.length &&
    actual.every((line, index) => line === expected[index]) &&
    !lines.includes('.claude/skills/') &&
    !lines.includes('.agents/skills/')
  )
}

async function auditRepo(
  r: Repo,
  files: Set<string>,
  ki: KiConfig | null,
  kiText: string | null,
  readme: string | null,
  gitignore: string | null,
  signals: Signals
): Promise<Finding[]> {
  const { f, fail, warn, note } = mk()
  const pkgDesc = pkgDescription(signals.pkg)
  if (r.isArchived) {
    warn('ACCESS-1', 'repo is archived — skipping remaining checks')
    return f
  }

  // ── layer 1: files (presence on the default branch) ── FILES-1
  for (const [, paths] of REQUIRED_FILES) {
    if (!paths.some((p) => files.has(p))) fail('FILES-1', `no ${paths.join(' / ')}`, paths[0])
  }
  // ── layer 1: runtime skill ignore contract (gated on the ki-repo marker) ── FILES-4
  const runtimeDeclaration = kiText == null ? undefined : parseSupportedRuntimes(kiText)
  const runtimeRules =
    runtimeDeclaration &&
    !runtimeDeclaration.issue &&
    runtimeDeclaration.runtimes.every((runtime) => KNOWN_RUNTIMES.includes(runtime))
      ? runtimeSkillIgnoreRules(runtimeDeclaration.runtimes)
      : undefined
  if (files.has(KI_CONFIG) && runtimeRules && !hasRuntimeSkillIgnoreRules(gitignore, runtimeRules))
    fail(
      'FILES-4',
      `.gitignore must declare the generated skill rules for supported_runtimes: ${runtimeRules.join(', ')}`,
      '.gitignore'
    )
  // ── layer 1: declared authoring baseline (gated on the ki-repo marker) ── FILES-3
  // A confirmed ki-repo declares the baseline authoring standard explicitly.
  // Native self-check resolution is a host precondition, not repository-local evidence.
  if (files.has(KI_CONFIG)) {
    if (!declaresRootTable(kiText ?? '', skillTable('ki-authoring')))
      fail(
        'FILES-3',
        `${KI_CONFIG} does not declare [skills.ki-authoring] — the authoring standard is baseline (run --educate)`,
        KI_CONFIG
      )
  }
  // ── layer 1: declared repository identity ── FILES-2
  if (!ki) fail('FILES-2', `${KI_CONFIG} has no [skills.${KI_SECTION}] table`, KI_CONFIG)
  else {
    if (!ki.repository || !GITHUB_REPOSITORY.test(ki.repository))
      fail('FILES-2', `${KI_CONFIG} must declare a canonical HTTPS GitHub \`repository\` URL`, KI_CONFIG)
    else if (`https://github.com/${r.nameWithOwner.toLowerCase()}` !== ki.repository)
      fail('FILES-2', `${KI_CONFIG} repository must equal the canonical GitHub home for ${r.nameWithOwner}`, KI_CONFIG)
    if (!ki.title?.trim()) fail('FILES-2', `${KI_CONFIG} must declare a non-empty \`title\``, KI_CONFIG)
    else if (readmeTitle(readme) !== ki.title.trim())
      fail('FILES-2', `README.md H1 must equal ${KI_CONFIG} title`, 'README.md')
    if (!ki.description?.trim()) fail('FILES-2', `${KI_CONFIG} must declare a non-empty \`description\``, KI_CONFIG)
    if (
      declaresRootTable(kiText ?? '', skillTable('ki-work-roadmap')) &&
      !/^[A-Z][A-Z0-9-]{1,23}$/.test(ki.repoCode ?? '')
    )
      fail(
        'FILES-2',
        `${KI_CONFIG} ki-repo repo_code must be a stable uppercase identifier when ki-work-roadmap is declared`,
        KI_CONFIG
      )
  }

  // ── repository kind and named KB store roles ── KIND-1/2
  if (kiText != null) {
    const configuration = parseRepositoryConfiguration(kiText)
    if (configuration.issue) fail('KIND-1', `[skills.${KI_SECTION}] ${configuration.issue}`, KI_CONFIG)
    else if (configuration.repositoryType === 'kb') {
      if (!declaresRootTable(kiText, skillTable('ki-repo-kb')))
        fail('KIND-2', 'repo_type = "kb" requires the [skills.ki-repo-kb] structure declaration', KI_CONFIG)
      if (declaresRootTable(kiText, skillTable('ki-work-roadmap')))
        fail(
          'KIND-2',
          'repo_type = "kb" cannot declare ki-work-roadmap; Knowledge Bases use ki-repo-kb-streams',
          KI_CONFIG
        )
    } else if (declaresRootTable(kiText, skillTable('ki-repo-kb')))
      fail('KIND-2', '[skills.ki-repo-kb] requires repo_type = "kb"', KI_CONFIG)
  }

  // ── layer 2: core GitHub ── GH-1
  if (r.defaultBranchRef?.name !== DEFAULT_BRANCH)
    fail('GH-1', `default branch is "${r.defaultBranchRef?.name ?? '?'}" (want ${DEFAULT_BRANCH})`)
  // License is the declared SPDX id from `[skills.ki-repo] license` (default MIT), decoupled
  // from visibility. The live GitHub license and package.json "license" must match the
  // declared id. A proprietary declaration (`UNLICENSED`/`proprietary`/`none`) expects
  // no recognised OSI license on GitHub and `"UNLICENSED"` in package.json.
  const declaredLicense = ki?.license ?? DEFAULT_LICENSE
  const proprietary = /^(unlicensed|proprietary|none)$/i.test(declaredLicense)
  const declaredKey = declaredLicense.toLowerCase()
  const liveKey = r.licenseInfo?.key ?? null
  // GH-2: declared license, cross-checked against live GitHub + package.json
  if (proprietary) {
    if (liveKey && !['other', 'noassertion', 'unlicensed'].includes(liveKey))
      fail('GH-2', `${KI_CONFIG} declares a proprietary license but GitHub reports "${liveKey}"`)
  } else if (liveKey !== declaredKey) {
    fail('GH-2', `license is "${liveKey ?? 'none'}" (want ${declaredLicense} per ${KI_CONFIG})`)
  }
  if (signals.pkg != null) {
    const pkgLicense = typeof signals.pkg.license === 'string' ? signals.pkg.license : null
    const wantPkg = proprietary ? 'UNLICENSED' : declaredLicense
    if (pkgLicense !== wantPkg)
      fail(
        'GH-2',
        `package.json "license" is ${JSON.stringify(pkgLicense)} (want ${JSON.stringify(wantPkg)} per ${KI_CONFIG})`,
        'package.json'
      )
  }
  // ── layer 2: package.json identity & metadata (the repo skill's manifest keys) ── PKG-1
  // engineering's coverage manifest assigns the identity/metadata keys to this skill;
  // here we check their presence/format. The keys: name, version, description, author,
  // license (above, GH-2), private, repository, homepage, bugs, keywords.
  if (signals.pkg != null) {
    const p = signals.pkg
    const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
    const urlOf = (v: unknown): string | null =>
      isStr(v) ? v : v && typeof v === 'object' ? ((v as { url?: unknown }).url as string) : null
    if (!isStr(p.name)) fail('PKG-1', 'package.json "name" missing', 'package.json')
    if (typeof p.version !== 'string' || !/^\d+\.\d+\.\d+/.test(p.version))
      fail('PKG-1', `package.json "version" must be semver, got ${JSON.stringify(p.version)}`, 'package.json')
    if (!isStr(p.author) && !(p.author != null && typeof p.author === 'object'))
      fail('PKG-1', 'package.json "author" missing', 'package.json')
    const repoUrl = urlOf(p.repository)
    if (!isStr(repoUrl)) fail('PKG-1', 'package.json "repository" missing a url', 'package.json')
    else if (!repoUrl.includes(r.nameWithOwner))
      warn(
        'PKG-1',
        `package.json "repository" url should reference ${r.nameWithOwner}\n      got: ${repoUrl}`,
        'package.json'
      )
    if (r.visibility === 'PRIVATE' && p.private !== true)
      fail('PKG-1', 'private repo: package.json must set "private": true', 'package.json')
    if (r.visibility === 'PUBLIC' && p.private === true)
      fail('PKG-1', 'public repo: package.json must not set "private": true', 'package.json')
    if (!isStr(urlOf(p.bugs))) warn('PKG-1', 'package.json "bugs" should carry a url', 'package.json')
    if (!isStr(p.homepage)) warn('PKG-1', 'package.json "homepage" missing', 'package.json')
    if (!Array.isArray(p.keywords) || p.keywords.length === 0)
      warn('PKG-1', 'package.json "keywords" should be a non-empty array', 'package.json')
  }
  // GH-3: description is declared in the ki-repo table, then synchronised with
  // GitHub and package.json when each surface exists.
  const declaredDescription = ki?.description?.trim()
  if (!declaredDescription) fail('GH-3', `${KI_CONFIG} must declare a non-empty \`description\``)
  else if (!r.description?.trim()) fail('GH-3', 'GitHub description is empty')
  else if (r.description.trim() !== declaredDescription)
    fail(
      'GH-3',
      `GitHub description ≠ ${KI_CONFIG} description\n      github: ${JSON.stringify(r.description.trim())}\n      config: ${JSON.stringify(declaredDescription)}`
    )
  else if (pkgDesc != null && pkgDesc !== declaredDescription)
    fail(
      'GH-3',
      `package.json description ≠ ${KI_CONFIG} description\n      package.json: ${JSON.stringify(pkgDesc)}\n      config: ${JSON.stringify(declaredDescription)}`,
      'package.json'
    )
  // MERGE-1: squash-only + auto-delete-branch.
  if (r.mergeCommitAllowed || r.rebaseMergeAllowed || !r.squashMergeAllowed)
    fail(
      'MERGE-1',
      `merge methods M/S/R = ${r.mergeCommitAllowed ? 'M' : '-'}/${r.squashMergeAllowed ? 'S' : '-'}/${r.rebaseMergeAllowed ? 'R' : '-'} (want -/S/-)`
    )
  if (!r.deleteBranchOnMerge) fail('MERGE-1', 'auto-delete head branch on merge is off')

  // VIS-1: visibility declared in .ki-config.toml, checked against live GitHub
  const declared = ki?.visibility?.toUpperCase()
  if (!ki) fail('VIS-1', `cannot verify visibility — ${KI_CONFIG} has no [skills.${KI_SECTION}] table (run --educate)`)
  else if (declared !== 'PUBLIC' && declared !== 'PRIVATE')
    fail('VIS-1', `${KI_CONFIG} does not declare a valid \`visibility\` (got ${JSON.stringify(ki.visibility)})`)
  else if (declared !== r.visibility)
    fail('VIS-1', `visibility is ${r.visibility} but ${KI_CONFIG} declares ${declared}`)

  // CHECKS-1 / COV-1 / BP-1 / TOGGLE-1 / TOPICS-1 / SEC-1: per-repo overrides — a check's
  // effective state is its [..checks] value, else the org default. Surface every active
  // override as a note (citing the overridden check's own code); advise dropping one that
  // merely restates the default; and WARN (CHECKS-1) a key that names no overridable check.
  // A `coverage-<skill>` key (default on) opts a repo out of one coverage signal (COV-1).
  const enforced = (id: string): boolean => ki?.checks[id] ?? CHECK_DEFAULTS[id] ?? true
  // Maps an overridable check id (CHECK_DEFAULTS key) to the rubric code that governs it,
  // so the note() below cites the SAME code the check itself fails/passes under.
  const AREA_FOR_CHECK: Record<string, string> = {
    'branch-protection': 'BP-1',
    wiki: 'TOGGLE-1',
    projects: 'TOGGLE-1',
    issues: 'TOGGLE-1',
    topics: 'TOPICS-1',
    'secret-scanning': 'SEC-1',
    'push-protection': 'SEC-1',
    structure: 'STRUCT-2'
  }
  for (const [id, v] of Object.entries(ki?.checks ?? {})) {
    if (id.startsWith('coverage-')) {
      const sk = id.slice('coverage-'.length)
      if (!COVERAGE_SKILLS.has(sk))
        warn('CHECKS-1', `"${id}" names no coverage skill (one of: ${[...COVERAGE_SKILLS].join(', ')})`)
      else if (!v) note('COV-1', `override: ki-${sk} coverage not enforced for this repo`)
      else
        note(
          'COV-1',
          `redundant: coverage-${sk} is enforced by default — can be dropped from [skills.${CHECKS_SECTION}]`
        )
    } else if (!(id in CHECK_DEFAULTS))
      warn(
        'CHECKS-1',
        `"${id}" is not an overridable check (overridable: ${Object.keys(CHECK_DEFAULTS).join(', ')}, or coverage-<skill>)`
      )
    else if (v !== CHECK_DEFAULTS[id])
      note(
        AREA_FOR_CHECK[id] ?? 'CHECKS-1',
        `override: ${v ? 'enforced' : 'not enforced'} for this repo (org default: ${CHECK_DEFAULTS[id] ? 'on' : 'off'})`
      )
    else
      note(
        AREA_FOR_CHECK[id] ?? 'CHECKS-1',
        `redundant: matches the org default (${v ? 'on' : 'off'}) — can be dropped from [skills.${CHECKS_SECTION}]`
      )
  }

  // ── coverage cascade (gated on the ki-repo marker) ──
  // Only a confirmed ki-repo (.ki-config.toml present) is checked for declaring the
  // other governance skills that apply to it. A repo without the marker already
  // FAILed `ki-config` above and is NOT a ki-repo, so it is never told to opt in —
  // that would be a false positive on a plain git repo that merely looks similar.
  if (files.has(KI_CONFIG)) {
    const text = kiText ?? ''
    for (const c of COVERAGE) {
      if (!enforced(`coverage-${c.skill}`)) continue
      const declared = declaresTable(text, c.table)
      const detected = c.detect(signals)
      if (detected && !declared)
        warn(
          'COV-1',
          `looks governed by ki-${c.skill} (${c.artifact}) but declares no [skills.${c.table}] — opt in, or set coverage-${c.skill} = false`
        )
      else if (declared && !detected)
        warn('COV-1', `declares [skills.${c.table}] but no ${c.artifact} found — stale opt-in?`)
    }

    // ── primary-structure cardinality ── STRUCT-1/2
    // Project and KB are mutually exclusive primaries. Repository specialisations compose
    // with either primary and must not participate in this count.
    const declaredStructure = PRIMARY_STRUCTURE_TABLES.filter((t) => declaresTable(text, t))
    if (declaredStructure.length > 1)
      fail(
        'STRUCT-1',
        `declares ${declaredStructure.length} primary structures (${declaredStructure.map((t) => `[skills.${t}]`).join(', ')}) — choose Project or Knowledge Base, not both`
      )
    else if (declaredStructure.length === 0 && enforced('structure'))
      warn(
        'STRUCT-2',
        'declares no primary repository structure — declare ki-repo-project for a non-KB repository or ki-repo-kb for a Knowledge Base'
      )

    // ── website implementation cardinality ── STRUCT-3/4
    // A website selects one purpose-specific implementation. Hosting adapters compose
    // independently and are deliberately excluded from this count.
    const declaredWebsiteImplementations = WEBSITE_IMPLEMENTATION_TABLES.filter((table) => declaresTable(text, table))
    if (declaredWebsiteImplementations.length > 1)
      fail(
        'STRUCT-3',
        `declares both website implementations (${declaredWebsiteImplementations.map((table) => `[skills.${table}]`).join(', ')}) — choose content or app, not both`
      )
    else if (declaresTable(text, skillTable('ki-repo-website')) && declaredWebsiteImplementations.length === 0)
      warn(
        'STRUCT-4',
        'declares [skills.ki-repo-website] but no implementation — choose ki-repo-website-content or ki-repo-website-app'
      )
  }

  // TOGGLE-1: repo-feature toggles (Issues on, Wiki/Projects off)
  if (enforced('issues') && !r.hasIssuesEnabled) fail('TOGGLE-1', 'Issues are disabled')
  if (enforced('wiki') && r.hasWikiEnabled) fail('TOGGLE-1', 'Wiki is enabled (want off)')
  if (enforced('projects') && r.hasProjectsEnabled) fail('TOGGLE-1', 'Projects are enabled (want off)')

  // TOPICS-1
  if (r.visibility === 'PUBLIC' && enforced('topics')) {
    const missing = TOPICS.filter((t) => !new Set(topicNames(r.repositoryTopics)).has(t))
    if (missing.length) fail('TOPICS-1', `missing topics: ${missing.join(', ')}`)
  }

  // BP-1: branch-protection — default OFF — `main` is open unless this repo sets it true.
  if (enforced('branch-protection')) {
    let bp: {
      required_pull_request_reviews?: unknown
      required_status_checks?: { contexts?: string[]; checks?: { context: string }[] }
      required_linear_history?: { enabled?: boolean }
    } | null
    try {
      bp = (await ghJSON(`repos/${r.nameWithOwner}/branches/${DEFAULT_BRANCH}/protection`)) as typeof bp
    } catch {
      bp = null
    }
    if (!bp) fail('BP-1', `no branch protection on ${DEFAULT_BRANCH}`)
    else {
      if (bp.required_pull_request_reviews == null) fail('BP-1', 'does not require a pull request')
      const presentChecks =
        bp.required_status_checks?.checks?.map((c) => c.context) ?? bp.required_status_checks?.contexts ?? []
      if (!presentChecks.includes(REQUIRED_CHECK)) fail('BP-1', `required checks omit "${REQUIRED_CHECK}"`)
      if (bp.required_linear_history?.enabled !== true) fail('BP-1', 'does not require linear history')
    }
  }

  // ── layer 3: deeper GitHub ── DEP-1: Dependabot alerts/updates + PR-branch freshness
  if (!(await ghOk(`repos/${r.nameWithOwner}/vulnerability-alerts`))) fail('DEP-1', 'Dependabot alerts are off')
  try {
    if (((await ghJSON(`repos/${r.nameWithOwner}/automated-security-fixes`)) as { enabled?: boolean }).enabled !== true)
      fail('DEP-1', 'Dependabot security updates are off')
  } catch {
    warn('DEP-1', 'could not read automated-security-fixes')
  }
  // "Always suggest updating pull request branches" — keeps PRs (Dependabot's included)
  // current with the base before merge, so a green PR is green against today's main.
  // REST-only: not exposed in the GraphQL `gh repo view` fields.
  try {
    if (((await ghJSON(`repos/${r.nameWithOwner}`)) as { allow_update_branch?: boolean }).allow_update_branch !== true)
      fail('DEP-1', 'allow_update_branch is off ("Always suggest updating pull request branches")')
  } catch {
    warn('DEP-1', 'could not read allow_update_branch')
  }
  // SEC-1: secret scanning + push protection (public).
  if (r.visibility === 'PUBLIC' && (enforced('secret-scanning') || enforced('push-protection'))) {
    try {
      const sa = (
        (await ghJSON(`repos/${r.nameWithOwner}`)) as {
          security_and_analysis?: {
            secret_scanning?: { status?: string }
            secret_scanning_push_protection?: { status?: string }
          }
        }
      ).security_and_analysis
      if (enforced('secret-scanning') && sa?.secret_scanning?.status !== 'enabled')
        fail('SEC-1', 'secret scanning is off')
      if (enforced('push-protection') && sa?.secret_scanning_push_protection?.status !== 'enabled')
        fail('SEC-1', 'secret-scanning push protection is off')
    } catch {
      warn('SEC-1', 'could not read security_and_analysis')
    }
  }
  // ACT-1
  try {
    const al = ((await ghJSON(`repos/${r.nameWithOwner}/actions/permissions`)) as { allowed_actions?: string })
      .allowed_actions
    if (al && al !== ALLOWED_ACTIONS) warn('ACT-1', `allowed_actions is "${al}" (standard: ${ALLOWED_ACTIONS})`)
  } catch {
    /* not always readable */
  }
  return f
}

// The agent runtimes the bootstrap linkers know how to install for. A repo may
// declare a subset in `[skills.ki-repo] supported_runtimes`; anything outside this set has no
// discovery path, so the linker would silently do nothing for it (RUNTIMES-1).
export const KNOWN_RUNTIMES = ['claude-code', 'claude-desktop', 'chatgpt-codex']
const LOCAL_SELF_SOURCE = '.agents/skills/ki-self'
const CLAUDE_SELF_PROJECTION = '.claude/skills/ki-self'

export const runtimeSkillIgnoreRules = (runtimes: readonly string[]): string[] => [
  ...(runtimes.includes('claude-code') ? ['.claude/skills/*'] : []),
  ...(runtimes.includes('chatgpt-codex') ? ['.agents/skills/*'] : []),
  '!.agents/skills/ki-self/',
  '!.agents/skills/ki-self/**'
]

// Parse `supported_runtimes = ["a", "b"]` from the [skills.ki-repo] table only (the documented
// home of the key — table-aware, unlike the bootstrap resolver's tolerant match).
// Returns null when the key is absent (the ["claude-code"] default applies, nothing to
// check), else the declared list (possibly empty).
export function parseSupportedRuntimes(text: string): { runtimes: string[]; rootTables: string[]; issue?: string } {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(text) as Record<string, unknown>
  } catch {
    return { runtimes: [], rootTables: [], issue: 'must be valid TOML' }
  }
  const rootTables = Object.entries(declaredSkills(document))
    .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
    .map(([name]) => name)
  const table = declaredSkills(document)[KI_SECTION]
  if (!table || typeof table !== 'object' || Array.isArray(table))
    return { runtimes: [], rootTables, issue: `must contain a [skills.${KI_SECTION}] table` }
  const runtimes = (table as Record<string, unknown>).supported_runtimes
  if (runtimes === undefined) return { runtimes: [], rootTables, issue: 'is required' }
  if (!Array.isArray(runtimes)) return { runtimes: [], rootTables, issue: 'must be an array of runtime names' }
  if (runtimes.length === 0) return { runtimes: [], rootTables, issue: 'must not be empty' }
  if (runtimes.some((runtime) => typeof runtime !== 'string'))
    return { runtimes: [], rootTables, issue: 'must contain only runtime names' }
  const list = runtimes as string[]
  if (new Set(list).size !== list.length) return { runtimes: [], rootTables, issue: 'must not repeat a runtime' }
  return { runtimes: list, rootTables }
}

const localState = (path: string): ReturnType<typeof lstatSync> | undefined => {
  try {
    return lstatSync(path)
  } catch {
    return undefined
  }
}

const localKiSelfFindings = (dir: string, runtimes: readonly string[]): Finding[] => {
  const { f, fail } = mk()
  const source = join(dir, LOCAL_SELF_SOURCE)
  const projection = join(dir, CLAUDE_SELF_PROJECTION)
  const sourceState = localState(source)
  const projectionState = localState(projection)

  // A repository-local ki-self is optional. Once either the canonical source or
  // runtime projection exists, however, its ownership and runtime shape are fixed.
  if (!sourceState && !projectionState) return f

  const sourceSkill = join(source, 'SKILL.md')
  const sourceIsCanonical = Boolean(
    sourceState?.isDirectory() && !sourceState.isSymbolicLink() && localState(sourceSkill)?.isFile()
  )
  if (!sourceIsCanonical) {
    fail('RUNTIMES-3', `${LOCAL_SELF_SOURCE}/ must be a physical directory containing SKILL.md`, LOCAL_SELF_SOURCE)
    return f
  }

  if (runtimes.includes('claude-code')) {
    if (!projectionState) {
      fail(
        'RUNTIMES-3',
        `declares claude-code but lacks the ${CLAUDE_SELF_PROJECTION} projection`,
        CLAUDE_SELF_PROJECTION
      )
      return f
    }
    if (!projectionState.isSymbolicLink()) {
      fail(
        'RUNTIMES-3',
        `${CLAUDE_SELF_PROJECTION} must be a relative symbolic link to ${LOCAL_SELF_SOURCE}`,
        CLAUDE_SELF_PROJECTION
      )
      return f
    }
    const target = readlinkSync(projection)
    if (isAbsolute(target)) {
      fail(
        'RUNTIMES-3',
        `${CLAUDE_SELF_PROJECTION} must use a relative symbolic link to ${LOCAL_SELF_SOURCE}`,
        CLAUDE_SELF_PROJECTION
      )
      return f
    }
    try {
      if (realpathSync(projection) !== realpathSync(source))
        fail('RUNTIMES-3', `${CLAUDE_SELF_PROJECTION} must resolve to ${LOCAL_SELF_SOURCE}`, CLAUDE_SELF_PROJECTION)
    } catch {
      fail(
        'RUNTIMES-3',
        `${CLAUDE_SELF_PROJECTION} must be a non-broken relative symbolic link to ${LOCAL_SELF_SOURCE}`,
        CLAUDE_SELF_PROJECTION
      )
    }
  } else if (projectionState) {
    fail(
      'RUNTIMES-3',
      `${CLAUDE_SELF_PROJECTION} is present but claude-code is not declared in supported_runtimes`,
      CLAUDE_SELF_PROJECTION
    )
  }

  return f
}

// RUNTIMES-1: validate the required `[skills.ki-repo] supported_runtimes` declaration. A pure
// local .ki-config.toml read — offline-safe, sitting beside vendor-integrity. Every
// name must be a runtime the linkers recognise; the support surface is never inferred.
export const requiredRuntimeSkills = (runtimes: readonly string[]): readonly string[] => {
  const required = new Set(['ki-tokenomics'])
  if (runtimes.includes('claude-code')) {
    required.add('ki-housekeeping-claude')
    required.add('ki-tokenomics-claude')
  }
  if (runtimes.includes('chatgpt-codex')) required.add('ki-tokenomics-codex')
  return [...required].sort()
}

function localConfigFindings(dir: string): Finding[] {
  const { f, fail } = mk()
  const cfgPath = join(dir, KI_CONFIG)
  if (!existsSync(cfgPath)) return f
  const parsed = parseSupportedRuntimes(readFileSync(cfgPath, 'utf8'))
  if (parsed.issue) {
    fail('RUNTIMES-1', `[skills.${KI_SECTION}] supported_runtimes ${parsed.issue}`, KI_CONFIG)
    return f
  }
  const retired = parsed.runtimes.filter((rt) => rt === 'codex')
  if (retired.length)
    fail(
      'RUNTIMES-1',
      `[skills.${KI_SECTION}] supported_runtimes uses retired runtime(s): ${retired.join(', ')}; use chatgpt-codex`,
      KI_CONFIG
    )
  if (retired.length) return f
  const unknown = parsed.runtimes.filter((rt) => !KNOWN_RUNTIMES.includes(rt))
  if (unknown.length)
    fail(
      'RUNTIMES-1',
      `[skills.${KI_SECTION}] supported_runtimes names unknown runtime(s): ${unknown.join(', ')} (known: ${KNOWN_RUNTIMES.join(', ')})`,
      KI_CONFIG
    )
  if (unknown.length) return f

  const required = requiredRuntimeSkills(parsed.runtimes)
  const declared = new Set(parsed.rootTables)
  const missing = required.filter((skill) => !declared.has(skill))
  if (missing.length)
    fail(
      'RUNTIMES-2',
      `supported runtime coverage requires missing table(s): ${missing.map((skill) => `[skills.${skill}]`).join(', ')}`,
      KI_CONFIG
    )
  f.push(...localKiSelfFindings(dir, parsed.runtimes))
  return f
}

// ── discovery ────────────────────────────────────────────────────────────────
type Target = { label: string; nameWithOwner: string | null; dir?: string; note?: string }
const GH_REMOTE = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/
const gitOrigin = (dir: string): string | null => {
  try {
    return execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim()
  } catch {
    return null
  }
}
function repoDirsUnder(path: string): string[] {
  if (existsSync(join(path, '.git'))) return [path]
  return readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .map((e) => join(path, e.name))
    .filter((d) => existsSync(join(d, '.git')))
    .sort()
}
function localTargets(path: string): Target[] {
  const abs = resolve(path)
  const dirs = repoDirsUnder(abs)
  if (dirs.length === 0) throw new Error(`no git repos found at ${abs}`)
  return dirs.map((dir) => {
    const label = dir.split('/').pop() ?? dir
    const m = gitOrigin(dir)?.match(GH_REMOTE)
    return m
      ? { label, nameWithOwner: `${m[1]}/${m[2]}`, dir }
      : { label, nameWithOwner: null, dir, note: 'origin not on github.com' }
  })
}
async function orgTargets(org: string): Promise<Target[]> {
  const repos: { nameWithOwner: string }[] = JSON.parse(
    await gh(['repo', 'list', org, '--limit', '200', '--json', 'nameWithOwner'])
  )
  return repos
    .map((r) => ({ label: r.nameWithOwner, nameWithOwner: r.nameWithOwner }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export type RepoAuditCollection = {
  target: string
  findings: readonly RepoEvidenceFinding[]
  educate?: string
}

const evidenceLevel = (level: Level): RepoEvidenceLevel => level

const LIVE_GITHUB_AREAS = new Set([
  'ACCESS-1',
  'GH-1',
  'MERGE-1',
  'TOGGLE-1',
  'VIS-1',
  'TOPICS-1',
  'BP-1',
  'DEP-1',
  'SEC-1',
  'ACT-1'
])
const MIXED_EVIDENCE_AREAS = new Set(['GH-2', 'GH-3', 'PKG-1'])
const CONTENT_AREAS = new Set([
  'FILES-1',
  'FILES-2',
  'FILES-3',
  'FILES-4',
  'KIND-1',
  'KIND-2',
  'GH-2',
  'GH-3',
  'PKG-1',
  'CHECKS-1',
  'COV-1',
  'STRUCT-1',
  'STRUCT-2',
  'STRUCT-3',
  'STRUCT-4'
])

const findingSource = (area: string, content: ContentSource, live = true): string => {
  if (!live) return content
  if (LIVE_GITHUB_AREAS.has(area)) return 'GitHub live state'
  if (MIXED_EVIDENCE_AREAS.has(area)) return `${content} + GitHub live state`
  return content
}

const scoped = (nwo: string, finding: Finding, content: ContentSource, live = true): string =>
  `${nwo} [${findingSource(finding.area, content, live)}]${finding.file ? `/${finding.file}` : ''}`

const auditLocalContent = async (nwo: string, content: ContentEvidence): Promise<Finding[]> => {
  const visibility = content.ki?.visibility?.toUpperCase() === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'
  const license = content.ki?.license?.toLowerCase() ?? DEFAULT_LICENSE.toLowerCase()
  const description = content.ki?.description?.trim() ?? ''
  const virtualRepo: Repo = {
    nameWithOwner: nwo,
    visibility,
    isArchived: false,
    defaultBranchRef: { name: DEFAULT_BRANCH },
    mergeCommitAllowed: false,
    squashMergeAllowed: true,
    rebaseMergeAllowed: false,
    deleteBranchOnMerge: true,
    hasIssuesEnabled: true,
    hasProjectsEnabled: false,
    hasWikiEnabled: false,
    repositoryTopics: TOPICS,
    licenseInfo: { key: license },
    description
  }
  return (
    await auditRepo(
      virtualRepo,
      content.files,
      content.ki,
      content.kiText,
      content.readme,
      content.gitignore,
      content.signals
    )
  ).filter((finding) => CONTENT_AREAS.has(finding.area))
}

// ── evidence collection ───────────────────────────────────────────────────
export const collectAuditFindings = async (
  argv: readonly string[],
  emit?: RubricEmitter
): Promise<RepoAuditCollection> => {
  ghEmit = emit
  try {
    return await collect(argv)
  } finally {
    ghEmit = undefined
  }
}

const collect = async (argv: readonly string[]): Promise<RepoAuditCollection> => {
  // `--educate` prints the default [skills.ki-repo] block for a new repo's
  // .ki-config.toml (authoring creates the keys; the author edits the values).
  if (argv.includes('--educate')) {
    return { target: resolve('.'), findings: [], educate: KI_DEFAULT }
  }
  const orgIdx = argv.indexOf('--org')
  let targets: Target[]
  try {
    if (orgIdx !== -1) {
      const org = argv[orgIdx + 1]
      if (!org) throw new Error('usage: audit.ts --org <org>')
      targets = await orgTargets(org)
    } else {
      const path = argv.find((a) => !a.startsWith('-')) ?? '.'
      targets = localTargets(path)
    }
  } catch (e) {
    return {
      target: resolve('.'),
      findings: [
        {
          level: 'FAIL',
          code: 'ACCESS-1',
          message: `could not enumerate audit targets: ${String((e as Error).message ?? e).split('\n')[0]}`
        }
      ]
    }
  }

  const reportTarget = resolve('.')
  const all: { level: Level; area: string; msg: string; ref?: string; file?: string }[] = []
  for (const t of targets) {
    // Runtime declarations are local-checkout evidence only; an `--org` run has no
    // filesystem and therefore does not manufacture it from a remote response.
    const localFindings = t.dir ? localConfigFindings(t.dir) : []
    let localContent: ContentEvidence | undefined
    if (t.dir) {
      try {
        localContent = localContentEvidence(t.dir)
      } catch (error) {
        all.push({
          level: 'FAIL',
          area: 'ACCESS-1',
          msg: `could not read local checkout evidence: ${String((error as Error).message ?? error).split('\n')[0]}`,
          ref: STD,
          file: `${t.label} [local checkout]`
        })
        continue
      }
    }
    if (!t.nameWithOwner) {
      all.push({
        level: 'NOT_APPLICABLE',
        area: 'ACCESS-1',
        msg: t.note ?? 'GitHub checks skipped',
        ref: STD,
        file: t.label
      })
      if (localContent) {
        for (const x of await auditLocalContent(t.label, localContent))
          all.push({
            level: x.level,
            area: x.area,
            msg: x.msg,
            ref: x.ref,
            file: scoped(t.label, x, localContent.source, false)
          })
      }
      for (const x of localFindings)
        all.push({ level: x.level, area: x.area, msg: x.msg, ref: x.ref, file: scoped(t.label, x, 'local checkout') })
      continue
    }
    // gh unauthenticated (typically CI): every GitHub-touching check is impossible, so skip
    // them as NOT_APPLICABLE rather than emitting a spurious access-FAIL. The offline vendor-integrity
    // findings above still count — that is the value this gate carries in CI (see ci.yml).
    if (!(await ghAuthed())) {
      const note = 'gh not authenticated — GitHub checks skipped (gh auth login)'
      all.push({ level: 'NOT_APPLICABLE', area: 'ACCESS-1', msg: note, ref: STD, file: t.nameWithOwner })
      if (localContent) {
        for (const x of await auditLocalContent(t.nameWithOwner, localContent))
          all.push({
            level: x.level,
            area: x.area,
            msg: x.msg,
            ref: x.ref,
            file: scoped(t.nameWithOwner, x, localContent.source, false)
          })
      }
      for (const x of localFindings)
        all.push({
          level: x.level,
          area: x.area,
          msg: x.msg,
          ref: x.ref,
          file: scoped(t.nameWithOwner, x, 'local checkout')
        })
      continue
    }
    let findings: Finding[]
    try {
      const r = JSON.parse(await gh(['repo', 'view', t.nameWithOwner, '--json', REPO_FIELDS])) as Repo
      const branch = r.defaultBranchRef?.name ?? DEFAULT_BRANCH
      const content = localContent ?? (await remoteContentEvidence(t.nameWithOwner, branch))
      // overrides are applied inside auditRepo: a not-enforced check simply does not fail
      // and is reported as INFO. No post-filtering here.
      findings = [
        ...(await auditRepo(
          r,
          content.files,
          content.ki,
          content.kiText,
          content.readme,
          content.gitignore,
          content.signals
        )),
        ...localFindings
      ]
      for (const x of findings)
        all.push({
          level: x.level,
          area: x.area,
          msg: x.msg,
          ref: x.ref,
          file: scoped(t.nameWithOwner, x, content.source)
        })
    } catch {
      findings = [
        {
          level: 'NOT_APPLICABLE',
          area: 'ACCESS-1',
          msg: 'Could not read the repository via gh — GitHub checks skipped (network or insufficient scope).',
          ref: STD
        },
        ...localFindings
      ]
      if (localContent) {
        for (const x of await auditLocalContent(t.nameWithOwner, localContent))
          all.push({
            level: x.level,
            area: x.area,
            msg: x.msg,
            ref: x.ref,
            file: scoped(t.nameWithOwner, x, localContent.source, false)
          })
      }
      for (const x of findings) {
        const source = x.area === 'RUNTIMES-1' || x.area === 'RUNTIMES-2' ? 'local checkout' : 'GitHub default branch'
        all.push({ level: x.level, area: x.area, msg: x.msg, ref: x.ref, file: scoped(t.nameWithOwner, x, source) })
      }
    }
  }

  return {
    target: reportTarget,
    findings: all.map(({ level, area, msg, file }) => ({
      level: evidenceLevel(level),
      code: area,
      message: msg,
      ...(file ? { subject: file } : {})
    }))
  }
}
