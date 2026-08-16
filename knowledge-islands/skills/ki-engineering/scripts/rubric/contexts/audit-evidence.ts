#!/usr/bin/env bun
/**
 * Mechanical auditor for the COMMON engineering layer of a Knowledge Islands
 * TypeScript/Bun repo.
 *
 *   ki repo audit [--repo <repo-path>]
 *
 * Checks the shared toolchain the `ki-engineering` skill codifies —
 * package.json metadata, the mise.toml toolchain pin (node + bun, bun matched to
 * packageManager, CI via mise-action + `ki repo audit`), the `bun test` trap,
 * tsconfig.json + tool exclusions, and the capability conditionals
 * (tests, compiled build + the cli-chmod rule, env) that fire only when the repo opts in.
 * It admits a `ki:` script only when one declared capability owns its script
 * family, and it does NOT judge that family's artifact-specific command shape
 * (an MCP's coverage-excludes, bin, tool surface) — that is the owning skill's
 * checker, run after this one. See references/rubric.md for the judgment half.
 *
 * Each finding carries a minted rubric code (PKG-*, MISE-*, SCR-*, …), a
 * reference-doc pointer (`ref`), and — when file-scoped — the path it concerns
 * (`file`); the native host renders the resulting evidence.
 * The one-to-one code↔criterion map is references/rubric.md.
 *
 * The native rubric host owns execution, reporting, and exit status.
 */
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { RubricEmitter } from '../../shared/rubric.ts'

// Unified severity ladder — shared by every KI checker (checker-contract).
// area is the minted rubric code (references/rubric.md); ref is its
// reference-doc pointer; file names the path a file-scoped finding concerns.
// ref/file are optional and give the native host enough context to render a useful finding.
export type EngineeringEvidenceFinding = {
  level: 'FAIL' | 'WARN' | 'INFO' | 'NOT_APPLICABLE' | 'PASS'
  code: string
  message: string
  subject?: string
}
type Level = EngineeringEvidenceFinding['level']
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }

// Reference-doc pointers — the substantive standard (cited by every minted code) and
// the rubric that maps code↔criterion (cited by the judgment/scope handoff).
const STD = 'references/standards-engineering.md'

const mechanicalEngineeringCheckIds = new Set([
  'PKG-1',
  'PKG-2',
  'PKG-3',
  'PKG-4',
  'PKG-5',
  'PKG-6',
  'MISE-1',
  'MISE-2',
  'MISE-3',
  'CI-1',
  'CI-2',
  'SCR-1',
  'SCR-2',
  'SCR-3',
  'SCR-4',
  'SCR-5',
  'SCR-6',
  'SCR-7',
  'TSC-1',
  'TSC-2',
  'BIO-1',
  'BIO-2',
  'KNIP-1',
  'KNIP-2',
  'KNIP-3',
  'SYNC-1',
  'DEPS-1',
  'GEN-1',
  'TEST-1',
  'TEST-2',
  'TEST-3',
  'TEST-4',
  'TEST-5',
  'BUILD-1',
  'BUILD-2',
  'BUILD-3',
  'BUILD-4',
  'ENV-1',
  'ENV-2',
  'TOML-1',
  'TOML-2',
  'TOML-3'
])

export const inspectEngineeringCheckRecords = (
  configuration: string
): readonly Pick<EngineeringEvidenceFinding, 'level' | 'message'>[] => {
  const header = /^\[skills\.ki-engineering\.checks\]\s*$/m.exec(configuration)
  if (!header || header.index === undefined)
    return [{ level: 'NOT_APPLICABLE', message: 'no engineering check records declared' }]
  const body = configuration.slice(header.index + header[0].length).split(/^\[/m)[0] ?? ''
  const records = [...body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=\s*([^#\r\n]+)(?:\s*#.*)?$/gm)]
  if (!records.length) return [{ level: 'PASS', message: 'engineering checks table has no records' }]
  return records.map((record) => {
    const key = record[1] ?? ''
    const value = record[2]?.trim() ?? ''
    if (!mechanicalEngineeringCheckIds.has(key))
      return { level: 'WARN', message: `unknown engineering check record: ${key}` }
    if (value !== 'true' && value !== 'false')
      return { level: 'WARN', message: `engineering check record ${key} must be boolean, got ${JSON.stringify(value)}` }
    return { level: 'PASS', message: `engineering check record ${key} = ${value} (diagnostic only)` }
  })
}

const scriptOwner = (key: string): string | undefined => {
  if (key === 'ki:deps:update') return 'ki-engineering'
  if (key === 'ki:eval') return 'ki-repo-harness'
  if (key.startsWith('ki:binding:')) return 'ki-binding-claude'
  if (['ki:site:deploy', 'ki:site:preview'].includes(key)) return 'ki-repo-website-cloudflare'
  if (key.startsWith('ki:site:')) return 'ki-repo-website'
  if (key.startsWith('ki:ingress:')) return 'ki-repo-website-cloudflare'
  if (key === 'ki:generate:client' || key.startsWith('ki:server:') || key.startsWith('ki:test:')) return 'ki-repo-mcp'
  if (key.startsWith('ki:tools:')) return 'ki-repo-tools'
  if (key.startsWith('ki:self:')) return 'ki-self'
  return undefined
}

// A declaration is a bare name under `[skills]`; the quoted form survives only for a skill drawn
// from a harness outside the declared list, so both spellings are read here.
const declaredSkillNames = (configuration: string): ReadonlySet<string> =>
  new Set(
    [...configuration.matchAll(/^\[skills\.(?:"[^"\n]+:(ki-[a-z0-9-]+)"|(ki-[a-z0-9-]+))\]/gm)].map(
      (match) => (match[1] ?? match[2]) as string
    )
  )

/** Inspect the repository once and return the complete engineering evidence set. */
const run = promisify(execFile)

export const collectAuditEvidence = async (
  repo: string,
  emit?: RubricEmitter
): Promise<readonly EngineeringEvidenceFinding[]> => {
  const findings: Finding[] = []
  const add = (level: Level, area: string, msg: string, ref?: string, file?: string): void => {
    findings.push({ level, area, msg, ref, file })
  }
  if (!repo || !existsSync(repo)) {
    add('FAIL', 'PKG-4', 'Audit target is missing or does not exist.', STD)
    return findings.map(({ level, area, msg, file }) => ({
      level,
      code: area,
      message: msg,
      ...(file ? { subject: file } : {})
    }))
  }
  const at = (...p: string[]) => join(repo, ...p)
  // Awaited rather than synchronous so the session yields between external commands: these
  // are the longest spans in a run, and a blocked event loop starves the host's progress
  // refresh, leaving a live audit indistinguishable from a hang.
  async function runCheck(area: string, label: string, cmd: string, ref?: string, file?: string): Promise<void> {
    emit?.({ kind: 'step', label, code: area })
    try {
      await run('/bin/sh', ['-c', cmd], { cwd: repo, encoding: 'utf8' })
      add('PASS', area, `${label} exits 0`, ref, file)
    } catch (e: unknown) {
      const err = e as { stderr?: string; stdout?: string }
      const detail = (err.stderr ?? err.stdout ?? '').trim()
      add(
        'FAIL',
        area,
        detail ? `${label} failed:\n  ${detail.split('\n').join('\n  ')}` : `${label} failed`,
        ref,
        file
      )
    }
  }
  const has = (...p: string[]) => existsSync(at(...p))
  const isDir = (...p: string[]) => has(...p) && statSync(at(...p)).isDirectory()
  const read = (...p: string[]): string => {
    try {
      return readFileSync(at(...p), 'utf8')
    } catch {
      return ''
    }
  }

  // Applicability gate: ki-engineering governs the TypeScript/Bun toolchain. A repo with
  // no package.json is not a TS/Bun repo — the same signal ki-repo's coverage cascade uses
  // to detect engineering — so every check below is inapplicable. Emit one not-applicable result and stop,
  // rather than a wall of FAILs. Bootstrap vendors this checker into every repo via the
  // ki-repo → ki-engineering implies edge, including non-code repos (dotfiles, KB, tap).
  if (!has('package.json')) {
    add('NOT_APPLICABLE', 'PKG-4', 'No package.json — the engineering standard does not apply.')
    return findings.map(({ level, area, msg, file }) => ({
      level,
      code: area,
      message: msg,
      ...(file ? { subject: file } : {})
    }))
  }

  let pkg: Record<string, unknown> = {}
  try {
    pkg = JSON.parse(read('package.json'))
  } catch {
    add('FAIL', 'PKG-4', 'package.json missing or unparseable', STD, 'package.json')
  }
  const scripts = (pkg.scripts ?? {}) as Record<string, string>
  // ── core: package.json metadata ───────────────────────────────────────────────
  pkg.type === 'module'
    ? add('PASS', 'PKG-1', 'type = "module"', STD, 'package.json')
    : add('FAIL', 'PKG-1', `type should be "module", got ${JSON.stringify(pkg.type)}`, STD, 'package.json')
  String(pkg.packageManager ?? '').startsWith('bun@')
    ? add('PASS', 'PKG-2', `packageManager = ${pkg.packageManager}`, STD, 'package.json')
    : add(
        'FAIL',
        'PKG-2',
        `packageManager should be bun@…, got ${JSON.stringify(pkg.packageManager)}`,
        STD,
        'package.json'
      )
  const nodeEngine = String((pkg.engines as Record<string, string> | undefined)?.node ?? '')
  const nodeOk = (() => {
    const m = nodeEngine.match(/>=\s*(\d+)/)
    return m ? Number(m[1]) >= 22 : false
  })()
  add(
    nodeOk ? 'PASS' : 'FAIL',
    'PKG-3',
    nodeOk ? `engines.node = ${nodeEngine}` : `engines.node should be >=22, got ${JSON.stringify(nodeEngine)}`,
    STD,
    'package.json'
  )

  // ── core: the coverage manifest — package.json is a CLOSED top-level key set ───
  // Every top-level key must be in the manifest (engineering-standard §1), each mapped
  // to an owning skill. An unknown key is drift: it would be an element no rubric drives.
  // This is the exhaustiveness half that makes "every element is governed" hold by
  // construction — the per-key CONTENT rules live in the owning skill's checker.
  const ALLOWED_KEYS = new Set<string>([
    // identity & metadata → ki-repo
    'name',
    'version',
    'description',
    'author',
    'license',
    'private',
    'repository',
    'homepage',
    'bugs',
    'keywords',
    // toolchain & structure → ki-engineering
    'type',
    'packageManager',
    'engines',
    'scripts',
    'devDependencies',
    'dependencies',
    'workspaces',
    'lint-staged',
    // published-artifact surface → the artifact skill (e.g. ki-repo-mcp)
    'main',
    'bin',
    'exports',
    'files'
  ])
  const unknownKeys = Object.keys(pkg).filter((k) => !ALLOWED_KEYS.has(k))
  unknownKeys.length
    ? add(
        'FAIL',
        'PKG-4',
        `ungoverned package.json key(s): ${unknownKeys.join(', ')} — every top-level key must be in the coverage manifest (engineering-standard §1) and assigned an owner`,
        STD,
        'package.json'
      )
    : add('PASS', 'PKG-4', 'all top-level keys are in the coverage manifest', STD, 'package.json')

  // ── core: lint-staged block + toolchain devDependencies (§1/§5) ───────────────
  // The lint:* / deps:* / prepare families above invoke a fixed toolchain; assert that
  // toolchain is actually declared, rather than left implied. lint-staged is the husky
  // pre-commit fan-out — a governed key in the manifest, so it must be present and wired.
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
  const REQUIRED_DEV = ['@biomejs/biome', 'knip', 'rumdl', 'husky', 'lint-staged', 'syncpack', 'typescript']
  const missingDev = REQUIRED_DEV.filter((d) => !(d in devDeps))
  missingDev.length
    ? add(
        'FAIL',
        'PKG-5',
        `missing toolchain devDependencies: ${missingDev.join(', ')} (the code and authoring tools the governance modes invoke)`,
        STD,
        'package.json'
      )
    : add(
        'PASS',
        'PKG-5',
        'toolchain devDependencies present (biome, rumdl, husky, lint-staged, syncpack, typescript)',
        STD,
        'package.json'
      )
  const lintStaged = pkg['lint-staged']
  if (!lintStaged || typeof lintStaged !== 'object') {
    add('FAIL', 'PKG-6', 'lint-staged block missing (the husky pre-commit fan-out)', STD, 'package.json')
  } else {
    const ls = JSON.stringify(lintStaged)
    const fanOut = ls.includes('@biomejs/biome') && ls.includes('rumdl')
    // rumdl resolves its own scope from .rumdl.toml, so a staged invocation needs no
    // flag to suppress a repository-wide glob the way markdownlint-cli2 did.
    const stagedMarkdownOnly = ls.includes('rumdl check --fix')
    // Trade records are no longer excluded from formatting: ki-trades AUTH-1 proves their
    // integrity by comparing meaning against the sender's copy, so the boundary is a check
    // rather than an exclusion list.
    fanOut && stagedMarkdownOnly
      ? add('PASS', 'PKG-6', 'lint-staged fans out to biome and rumdl', STD, 'package.json')
      : add(
          'WARN',
          'PKG-6',
          'lint-staged should run biome over staged code and rumdl check --fix over staged Markdown',
          STD,
          'package.json'
        )
  }

  // ── core: mise.toml toolchain pin ─────────────────────────────────────────────
  // Root mise.toml pins the actual node + bun (mise puts them on PATH on `cd`; CI
  // installs them via jdx/mise-action). The pinned bun MUST equal packageManager's
  // bun — the standing drift pair. node is pinned exactly here (engines is a floor).
  const mise = read('mise.toml')
  if (!mise) add('FAIL', 'MISE-1', 'mise.toml missing (root toolchain pin: [tools] node + bun)', STD, 'mise.toml')
  else {
    const miseNode = mise.match(/^\s*node\s*=\s*["']([^"']+)["']/m)?.[1]
    const miseBun = mise.match(/^\s*bun\s*=\s*["']([^"']+)["']/m)?.[1]
    miseNode
      ? add('PASS', 'MISE-1', `mise.toml pins node = ${miseNode}`, STD, 'mise.toml')
      : add('FAIL', 'MISE-1', 'mise.toml must pin node under [tools]', STD, 'mise.toml')
    if (!miseBun) add('FAIL', 'MISE-1', 'mise.toml must pin bun under [tools]', STD, 'mise.toml')
    else {
      const pmBun = String(pkg.packageManager ?? '').match(/^bun@(.+)$/)?.[1]
      pmBun && pmBun !== miseBun
        ? add('FAIL', 'MISE-2', `mise.toml bun (${miseBun}) must match packageManager bun (${pmBun})`, STD, 'mise.toml')
        : add(
            'PASS',
            'MISE-2',
            `mise.toml pins bun = ${miseBun}${pmBun ? ' (matches packageManager)' : ''}`,
            STD,
            'mise.toml'
          )
    }
  }
  // legacy single-tool pin files shadow mise.toml — warn (redundant, can diverge)
  const strayPins = ['.node-version', '.nvmrc', '.bun-version'].filter((f) => has(f))
  strayPins.length
    ? add(
        'WARN',
        'MISE-3',
        `legacy pin file(s) beside mise.toml: ${strayPins.join(', ')} — remove; mise.toml is the single toolchain pin`,
        STD
      )
    : add('PASS', 'MISE-3', 'no legacy pin files (.node-version / .nvmrc / .bun-version)', STD)

  // ── core (when the repo has CI): the common CI shape ──────────────────────────
  // CI installs the toolchain from mise.toml and invokes the installed native CLI
  // directly. `bun run test` follows for the repo's self-tests.
  if (has('.github', 'workflows', 'ci.yml')) {
    const ci = read('.github', 'workflows', 'ci.yml')
    const commandIndex = (commandValue: string): number => {
      const escaped = commandValue
        .trim()
        .split(/\s+/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[ \\t]+')
      const command = new RegExp(
        `(?:^[ \\t]*(?:-[ \\t]*)?(?:run:[ \\t]*)?|&&[ \\t]*|\\|\\|[ \\t]*|;[ \\t]*)(["']?)${escaped}[ \\t]*\\1(?=[ \\t]*(?:&&|\\|\\||;|#|\\r?$))`,
        'm'
      )
      return ci.search(command)
    }
    const usesMise = /mise-action/.test(ci)
    usesMise
      ? add('PASS', 'CI-1', 'ci.yml installs the toolchain via jdx/mise-action', STD, '.github/workflows/ci.yml')
      : add(
          'FAIL',
          'CI-1',
          'ci.yml must install the toolchain via jdx/mise-action (reads mise.toml)',
          STD,
          '.github/workflows/ci.yml'
        )
    const hard = ci.match(/\b(bun|node)-version\s*:/)
    if (hard)
      add(
        'FAIL',
        'CI-1',
        `ci.yml hardcodes ${hard[1]}-version — remove it; the version comes from mise.toml`,
        STD,
        '.github/workflows/ci.yml'
      )
    // CI names its target explicitly. The bare form remains a valid local CLI
    // invocation, but a workflow must prove which checkout it governs.
    const auditIndex = ci.search(
      /(?:^[ \t]*(?:-[ \t]*)?(?:run:[ \t]*)?|&&[ \t]*|\|\|[ \t]*|;[ \t]*)(["']?)ki[ \t]+repo[ \t]+audit[ \t]+--repo[ \t]+\.[ \t]*\1(?=[ \t]*(?:&&|\|\||;|#|\r?$))/m
    )
    auditIndex >= 0
      ? add(
          'PASS',
          'CI-2',
          'ci.yml runs the native repository gate "ki repo audit --repo ."',
          STD,
          '.github/workflows/ci.yml'
        )
      : add('FAIL', 'CI-2', 'ci.yml must run "ki repo audit --repo ." directly', STD, '.github/workflows/ci.yml')
    if (scripts.test) {
      const testIndex = commandIndex('bun run test')
      if (testIndex < 0)
        add(
          'FAIL',
          'CI-2',
          'ci.yml must run the exact command "bun run test" after native audit when package.json exposes tests',
          STD,
          '.github/workflows/ci.yml'
        )
      else if (auditIndex >= 0 && auditIndex < testIndex)
        add(
          'PASS',
          'CI-2',
          'ci.yml runs the repository self-test suite "bun run test" after native audit',
          STD,
          '.github/workflows/ci.yml'
        )
      else
        add(
          'FAIL',
          'CI-2',
          'ci.yml must run "ki repo audit --repo ." before "bun run test"',
          STD,
          '.github/workflows/ci.yml'
        )
    }
    if (/\bbun\s+run\s+ki:(?:audit|conform|educate|help|verify)\b/.test(ci))
      add(
        'FAIL',
        'CI-2',
        'ci.yml routes governance through a retired package-script alias; invoke "ki repo audit --repo ." directly',
        STD,
        '.github/workflows/ci.yml'
      )
  } else {
    add('NOT_APPLICABLE', 'CI-1', 'no .github/workflows/ci.yml — not applicable', STD)
  }

  // Repo shape — flat vs monorepo (§0). A flat repo is one root TS project (`tsc --noEmit`);
  // a monorepo declares its packages in the standard Bun `workspaces` array in package.json
  // (e.g. ["site", "ingress"]), whose per-package tsconfigs can carry incompatible
  // `types`/`lib`, so it is type-checked per package rather than once at the root.
  const workspaces = Array.isArray(pkg.workspaces)
    ? (pkg.workspaces as string[]).filter((w) => typeof w === 'string')
    : []

  // ── core: the read-only toolchain, run directly (audit = lint WITHOUT fixing) ──
  // The native ki-engineering rubric runs all read-only tool checks itself. The tools
  // are not hidden behind package scripts. The Markdown gate remains ki-authoring's
  // responsibility and is orchestrated by `ki repo audit`.
  await runCheck('BIO-1', 'biome check', 'bunx @biomejs/biome check', STD)
  if (workspaces.length) {
    const noTsconfig = workspaces.filter((p) => !read(`${p}/tsconfig.json`))
    if (noTsconfig.length)
      add('FAIL', 'TSC-1', `workspaces names dir(s) without a tsconfig.json: ${noTsconfig.join(', ')}`, STD)
    for (const ws of workspaces.filter((p) => read(`${p}/tsconfig.json`)))
      await runCheck('TSC-1', `tsc ${ws}`, `tsc --noEmit -p ${ws}/tsconfig.json`, STD)
  } else {
    await runCheck('TSC-1', 'tsc --noEmit', 'tsc --noEmit', STD)
  }
  await runCheck('SYNC-1', 'syncpack format (check)', 'bunx syncpack format --check', STD)
  await runCheck('KNIP-2', 'knip', 'bunx knip --no-config-hints', STD)

  // ── core: native CLI ownership + retired-key drift ────────────────────────────
  const nativeGovernanceAliases = Object.entries(scripts)
    .filter(([, value]) => /\bki\s+repo\s+(?:audit|conform|educate)\b/.test(value))
    .map(([key]) => key)
  nativeGovernanceAliases.length
    ? add(
        'FAIL',
        'SCR-2',
        `repository maintenance must use the installed CLI directly; remove package script(s) that invoke native governance: ${nativeGovernanceAliases.join(', ')}`,
        STD,
        'package.json'
      )
    : add(
        'PASS',
        'SCR-2',
        'repository maintenance has no package scripts that invoke native governance',
        STD,
        'package.json'
      )
  const retired = Object.keys(scripts).filter(
    (key) =>
      /^ki:lint:/.test(key) ||
      (/^ki:deps:/.test(key) && key !== 'ki:deps:update') ||
      key === 'ki:knip' ||
      key === 'ki:verify' ||
      /^ki:[a-z-]+:lint$/.test(key) ||
      ['ki:audit', 'ki:conform', 'ki:educate', 'ki:help'].includes(key)
  )
  const declared = declaredSkillNames(read('.ki-config.toml'))
  const unsupported = Object.keys(scripts).filter(
    (key) => key.startsWith('ki:') && (!scriptOwner(key) || !declared.has(scriptOwner(key) as string))
  )
  const missingDependencyUpdate = !Object.hasOwn(scripts, 'ki:deps:update')
  const scriptProblems = [
    ...(retired.length ? [`retired script key(s): ${retired.join(', ')}`] : []),
    ...(unsupported.length ? [`unsupported or undeclared-owner script key(s): ${unsupported.join(', ')}`] : []),
    ...(missingDependencyUpdate ? ['missing required ki:deps:update'] : [])
  ]
  scriptProblems.length
    ? add(
        'FAIL',
        'SCR-3',
        `${scriptProblems.join('; ')} — every ki: script must be owned by a declared capability`,
        STD,
        'package.json'
      )
    : add('PASS', 'SCR-3', 'every ki: script has a declared owner and ki:deps:update is present', STD, 'package.json')

  // ── core: per-skill wrapper aliases are retired ──────────────────────────────
  const skillModeAliases = Object.keys(scripts).filter((key) => /^ki:[a-z-]+:(audit|conform|educate|help)$/.test(key))
  const runtimeAliases = Object.entries(scripts)
    .filter(([, value]) =>
      /(?:^|[ /])\.ki\/(?:bin|bootstrap)(?:[ /]|$)|scripts\/(?:govern|educate)\.ts|scripts\/rubric\/index\.ts|scripts\/vendored\//.test(
        value
      )
    )
    .map(([key]) => key)
  const legacyAliases = [...new Set([...skillModeAliases, ...runtimeAliases])]
  legacyAliases.length
    ? add(
        'FAIL',
        'SCR-4',
        `remove legacy governance wrapper script(s): ${legacyAliases.join(', ')}`,
        STD,
        'package.json'
      )
    : add('PASS', 'SCR-4', 'no per-skill or path-based governance wrappers', STD, 'package.json')
  // clean (removes node_modules; may also remove dist) + prepare = husky
  scripts.clean?.includes('node_modules')
    ? add('PASS', 'SCR-5', `clean = ${JSON.stringify(scripts.clean)}`, STD, 'package.json')
    : add('FAIL', 'SCR-5', 'clean must remove node_modules (e.g. "rm -rf {dist,node_modules}")', STD, 'package.json')
  scripts.prepare === 'husky'
    ? add('PASS', 'SCR-5', 'prepare = "husky"', STD, 'package.json')
    : add('WARN', 'SCR-5', `prepare should be "husky", got ${JSON.stringify(scripts.prepare)}`, STD, 'package.json')

  // ── core: the ki: naming law — every script is a bare idiom or ki:-prefixed ────
  // engineering-standard §2: a script is valid iff it is one of the six universal
  // lifecycle idioms OR carries the ki: prefix. A bare non-idiom name is drift — this
  // is what keeps the script surface fully governed (every ki:* script is asserted by
  // some KI skill; the artifact/governance skills own their ki:* deltas).
  const BARE_IDIOMS = new Set<string>(['build', 'prepare', 'test', 'test:coverage', 'test:watch', 'clean'])
  const offenders = Object.keys(scripts).filter((k) => !BARE_IDIOMS.has(k) && !k.startsWith('ki:'))
  offenders.length
    ? add(
        'FAIL',
        'SCR-1',
        `ungoverned script name(s): ${offenders.join(', ')} — every script must be a bare lifecycle idiom (${[...BARE_IDIOMS].join(', ')}) or carry the ki: prefix (engineering-standard §2)`,
        STD,
        'package.json'
      )
    : add('PASS', 'SCR-1', 'all scripts are bare idioms or ki:-prefixed (naming law)', STD, 'package.json')

  // ── advisory: dependency freshness (bun outdated) ────────────────────────────
  try {
    const out = (await run('/bin/sh', ['-c', 'bun outdated'], { cwd: repo, encoding: 'utf8' })).stdout.trim()
    const pkgRows = out.split('\n').filter((l) => l.includes('│') && !l.includes('Package') && !l.includes('Current'))
    if (pkgRows.length === 0) {
      add('PASS', 'DEPS-1', 'all packages up to date (bun outdated)', STD)
    } else {
      add(
        'INFO',
        'DEPS-1',
        `${pkgRows.length} package${pkgRows.length === 1 ? '' : 's'} have updates available — run \`ki repo conform\`:\n  ${out}`,
        STD
      )
    }
  } catch {
    add('NOT_APPLICABLE', 'DEPS-1', 'bun outdated unavailable — upgrade Bun to check dependency freshness', STD)
  }

  // ── core: the `bun test` bypass trap ──────────────────────────────────────────
  // The governed bare `test` entrypoint may itself choose Bun's runner. Every other
  // script must delegate through `bun run test`, rather than bypassing that policy.
  const bunTest = Object.entries(scripts).filter(([name, value]) => name !== 'test' && /\bbun test\b/.test(value))
  bunTest.length
    ? add(
        'FAIL',
        'SCR-6',
        `bypasses the governed test entrypoint with "bun test" in: ${bunTest.map(([name]) => name).join(', ')}`,
        STD,
        'package.json'
      )
    : add('PASS', 'SCR-6', 'no non-test script bypasses the governed test entrypoint', STD, 'package.json')

  // ── core: tsconfig.json (universal invariants only; richer base is profiled) ──
  // tsconfig may carry // comments (the website's does), so check by regex on text,
  // not JSON.parse. Only the invariants ALL repos share are core; the fuller shared
  // base (es2024, verbatimModuleSyntax, the noImplicit* family, and config-gated
  // vitest/globals types) is checked under the compiled-build capability below.
  const ts = read('tsconfig.json')
  if (!ts) add('FAIL', 'TSC-2', 'tsconfig.json missing', STD, 'tsconfig.json')
  else {
    const tsCore: [string, RegExp][] = [
      ['strict: true', /"strict"\s*:\s*true/],
      ['module: nodenext', /"module"\s*:\s*"nodenext"/i],
      ['moduleResolution: nodenext', /"moduleResolution"\s*:\s*"nodenext"/i],
      ['noEmit: true', /"noEmit"\s*:\s*true/],
      ['isolatedModules: true', /"isolatedModules"\s*:\s*true/],
      ['esModuleInterop: true', /"esModuleInterop"\s*:\s*true/],
      ['skipLibCheck: true', /"skipLibCheck"\s*:\s*true/]
    ]
    for (const [label, re] of tsCore)
      re.test(ts)
        ? add('PASS', 'TSC-2', label, STD, 'tsconfig.json')
        : add('FAIL', 'TSC-2', `tsconfig.json missing universal invariant: ${label}`, STD, 'tsconfig.json')
  }

  // ── core: biome.json (shared FIELDS, not byte-identical — files globs vary) ───
  const biome = read('biome.json')
  if (!biome) add('FAIL', 'BIO-2', 'biome.json missing', STD, 'biome.json')
  else {
    const fields: [string, RegExp][] = [
      ['formatter lineWidth 120', /"lineWidth"\s*:\s*120/],
      ['formatter indentWidth 2', /"indentWidth"\s*:\s*2/],
      ['js quoteStyle single', /"quoteStyle"\s*:\s*"single"/],
      ['js semicolons asNeeded', /"semicolons"\s*:\s*"asNeeded"/],
      ['js trailingCommas none', /"trailingCommas"\s*:\s*"none"/],
      ['linter preset recommended', /"recommended"|"preset"\s*:\s*"recommended"/],
      ['noExplicitAny off', /"noExplicitAny"\s*:\s*"off"/],
      ['organizeImports on', /"organizeImports"\s*:\s*"on"/]
    ]
    for (const [label, re] of fields)
      re.test(biome)
        ? add('PASS', 'BIO-2', label, STD, 'biome.json')
        : add('WARN', 'BIO-2', `biome.json: expected ${label}`, STD, 'biome.json')
  }

  // ── core: knip.json (backs the native ki-engineering check) ──────────────────
  // knip is run directly by the native rubric (dependency + dead-code hygiene);
  // every repo carries a knip.json declaring its entry points (so the public surface
  // isn't misread as dead code) and any intentional ignores.
  has('knip.json') || has('knip.jsonc') || has('knip.ts')
    ? add('PASS', 'KNIP-1', 'knip.json present (entry points + ignores for the native knip check)', STD, 'knip.json')
    : add('FAIL', 'KNIP-1', 'knip.json missing (config for the native knip check)', STD, 'knip.json')

  // ── core: knip entry points cover every package export ──────────────────────
  // `knip --fix` (the KNIP-2 repair) DELETES exports it believes are unused. An
  // entrypoint published through `exports` but not reachable from any `entry` glob
  // is invisible to knip as a public surface, so genuine public API gets deleted.
  // Mechanically checkable, so it is checked here rather than left to review.
  // Audit only: which entry glob to add is a judgment call, so there is no repair.
  const knipConfigSource = read('knip.json') || read('knip.jsonc')
  const exportsMap = pkg.exports
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    add('NOT_APPLICABLE', 'KNIP-3', 'package.json declares no exports map', STD, 'package.json')
  } else {
    // knip.json is JSON with C-style comments permitted; strip them string-aware so
    // that `"$schema": "https://…"` is not mistaken for a line comment.
    const stripJsonComments = (text: string): string => {
      let out = ''
      let inString = false
      let escaped = false
      for (let index = 0; index < text.length; index += 1) {
        const ch = text[index] as string
        if (inString) {
          out += ch
          if (escaped) escaped = false
          else if (ch === '\\') escaped = true
          else if (ch === '"') inString = false
          continue
        }
        if (ch === '"') {
          inString = true
          out += ch
          continue
        }
        if (ch === '/' && text[index + 1] === '/') {
          while (index < text.length && text[index] !== '\n') index += 1
          out += '\n'
          continue
        }
        if (ch === '/' && text[index + 1] === '*') {
          index += 2
          while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) index += 1
          index += 1
          out += ' '
          continue
        }
        out += ch
      }
      return out
    }
    let knipConfig: Record<string, unknown> | undefined
    if (knipConfigSource) {
      try {
        const parsed: unknown = JSON.parse(stripJsonComments(knipConfigSource))
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
          knipConfig = parsed as Record<string, unknown>
      } catch {
        knipConfig = undefined
      }
    }
    if (!knipConfig) {
      add(
        'INFO',
        'KNIP-3',
        'knip entry list is not mechanically readable (no parseable knip.json / knip.jsonc)',
        STD,
        'knip.json'
      )
    } else {
      const entryList = (value: unknown): readonly string[] =>
        typeof value === 'string'
          ? [value]
          : Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : []
      const workspaces = knipConfig.workspaces
      const rootWorkspace =
        workspaces && typeof workspaces === 'object' && !Array.isArray(workspaces)
          ? ((workspaces as Record<string, unknown>)['.'] ?? (workspaces as Record<string, unknown>)['./'])
          : undefined
      const declaredEntries = [
        ...entryList(knipConfig.entry),
        ...(rootWorkspace && typeof rootWorkspace === 'object' && !Array.isArray(rootWorkspace)
          ? entryList((rootWorkspace as Record<string, unknown>).entry)
          : [])
      ]
      // A knip entry pattern may carry a trailing `!` (production mode) or a leading
      // `!` (negation); neither is part of the path glob.
      const trimSuffix = (pattern: string): string => pattern.replace(/!+$/, '')
      const included = declaredEntries.filter((pattern) => !pattern.startsWith('!')).map(trimSuffix)
      const excluded = declaredEntries
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => trimSuffix(pattern.slice(1)))
      const globToRegExp = (pattern: string): RegExp => {
        let source = ''
        for (let index = 0; index < pattern.length; index += 1) {
          const ch = pattern[index] as string
          if (ch === '*') {
            if (pattern[index + 1] === '*') {
              index += 1
              if (pattern[index + 1] === '/') {
                index += 1
                source += '(?:[^/]*/)*'
              } else source += '.*'
            } else source += '[^/]*'
            continue
          }
          if (ch === '?') {
            source += '[^/]'
            continue
          }
          if (ch === '{') {
            source += '(?:'
            continue
          }
          if (ch === '}') {
            source += ')'
            continue
          }
          if (ch === ',') {
            source += '|'
            continue
          }
          source += ch.replace(/[.+^$()|[\]\\]/g, '\\$&')
        }
        return new RegExp(`^${source}$`)
      }
      const covered = (path: string): boolean =>
        included.some((pattern) => globToRegExp(pattern).test(path)) &&
        !excluded.some((pattern) => globToRegExp(pattern).test(path))
      // A built target maps back to its source: ./dist/X.js and ./dist/X.d.ts → src/X.ts.
      const sourceForTarget = (target: string): string | undefined => {
        const relative = target.replace(/^\.\//, '')
        const mapped = relative.startsWith('dist/') ? `src/${relative.slice('dist/'.length)}` : relative
        if (mapped.endsWith('.d.ts')) return `${mapped.slice(0, -'.d.ts'.length)}.ts`
        const built = /\.(?:js|mjs|cjs)$/.exec(mapped)
        if (built) return `${mapped.slice(0, -built[0].length)}.ts`
        return mapped.endsWith('.ts') ? mapped : undefined
      }
      const targets: [string, string][] = []
      const collect = (subpath: string, value: unknown): void => {
        if (typeof value === 'string') targets.push([subpath, value])
        else if (value && typeof value === 'object' && !Array.isArray(value))
          for (const nested of Object.values(value as Record<string, unknown>)) collect(subpath, nested)
      }
      for (const [subpath, value] of Object.entries(exportsMap as Record<string, unknown>)) {
        if (subpath === './package.json') continue
        collect(subpath, value)
      }
      const seen = new Set<string>()
      let checked = 0
      for (const [subpath, target] of targets) {
        if (target === './package.json') continue
        const source = sourceForTarget(target)
        if (source === undefined) {
          const key = `unmapped:${subpath}:${target}`
          if (seen.has(key)) continue
          seen.add(key)
          add(
            'INFO',
            'KNIP-3',
            `export "${subpath}" → ${target} does not map to a source file mechanically`,
            STD,
            'package.json'
          )
          continue
        }
        if (source.includes('*')) {
          const key = `pattern:${subpath}:${source}`
          if (seen.has(key)) continue
          seen.add(key)
          add(
            'INFO',
            'KNIP-3',
            `export "${subpath}" is a subpath pattern (${target}); entry coverage needs review`,
            STD,
            'package.json'
          )
          continue
        }
        const key = `${subpath}:${source}`
        if (seen.has(key)) continue
        seen.add(key)
        checked += 1
        covered(source)
          ? add(
              'PASS',
              'KNIP-3',
              `export "${subpath}" → ${source} is reachable from a knip entry point`,
              STD,
              'knip.json'
            )
          : add(
              'FAIL',
              'KNIP-3',
              `export "${subpath}" → ${source} is not reachable from any knip entry point (knip --fix may delete its exports)`,
              STD,
              'knip.json'
            )
      }
      if (!checked && !seen.size)
        add('NOT_APPLICABLE', 'KNIP-3', 'package.json declares no non-exempt exports', STD, 'package.json')
    }
  }

  // ── core: generated and managed discovery surfaces ──────────────────────────
  // These are byte-for-byte artifacts owned elsewhere. Formatting or dead-code checks
  // must never rewrite or report them. `ki-authoring` owns the Markdown configuration,
  // but this common engineering rule verifies the three tool surfaces agree.
  type GeneratedSurface = {
    signal: string[]
    label: string
    biome: string
    knip: string
    markdown: string
  }
  const GENERATED_SURFACES: GeneratedSurface[] = [
    {
      signal: ['src', 'generated'],
      label: 'src/generated/',
      biome: 'src/generated',
      knip: 'src/generated',
      markdown: 'src/generated'
    },
    {
      signal: ['.claude', 'skills'],
      label: '.claude/skills/',
      biome: '.claude/skills',
      knip: '.claude/skills',
      markdown: '.claude/skills'
    },
    {
      signal: ['.claude', 'agents'],
      label: '.claude/agents/',
      biome: '.claude/agents',
      knip: '.claude/agents',
      markdown: '.claude/agents'
    },
    {
      signal: ['.agents', 'skills'],
      label: '.agents/skills/',
      biome: '.agents/skills',
      knip: '.agents/skills',
      markdown: '.agents/skills'
    }
  ]
  const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const excludes = (content: string, path: string, negative = false): boolean => {
    const prefix = negative ? '!' : ''
    // A parent exclusion (for example `.claude/**`) legitimately covers a selected
    // generated child (`.claude/skills/**`), while preserving authored siblings is
    // preferred where those siblings exist.
    const ancestors = path.split('/').map((_, index, parts) => parts.slice(0, index + 1).join('/'))
    return ancestors.some((candidate) =>
      new RegExp(`["']${escapeRe(`${prefix}${candidate}`)}(?:/\\*\\*)?["']`).test(content)
    )
  }
  const rumdl = read('.rumdl.toml')
  const legacyExclusions = [
    ['biome.json', biome],
    ['knip.json', read('knip.json') || read('knip.jsonc') || read('knip.ts')],
    ['.rumdl.toml', rumdl]
  ].flatMap(([file, content]) =>
    ['.ki/bootstrap', '.ki/bin'].flatMap((path) => (content.includes(path) ? [`${file} → ${path}`] : []))
  )
  const activeGeneratedSurfaces = GENERATED_SURFACES.filter((surface) => isDir(...surface.signal))
  if (legacyExclusions.length) {
    add('FAIL', 'GEN-1', `remove legacy KI runtime exclusion(s): ${legacyExclusions.join('; ')}`, STD)
  } else if (!activeGeneratedSurfaces.length) {
    add('NOT_APPLICABLE', 'GEN-1', 'no generated or managed discovery surfaces detected', STD)
  } else {
    const missing: string[] = []
    for (const surface of activeGeneratedSurfaces) {
      if (!excludes(biome, surface.biome, true)) missing.push(`biome.json → ${surface.label}`)
      if (!excludes(read('knip.json') || read('knip.jsonc') || read('knip.ts'), surface.knip))
        missing.push(`knip.json → ${surface.label}`)
      if (!excludes(rumdl, surface.markdown)) missing.push(`.rumdl.toml → ${surface.label}`)
    }
    missing.length
      ? add(
          'FAIL',
          'GEN-1',
          `managed surfaces need matching Biome, knip, and Markdown exclusions: ${missing.join('; ')}`,
          STD
        )
      : add(
          'PASS',
          'GEN-1',
          `managed surfaces excluded across Biome, knip, and Markdown: ${activeGeneratedSurfaces.map((s) => s.label).join(', ')}`,
          STD
        )
  }

  // .rumdl.toml content is owned and audited by ki-authoring (it backs that skill's own
  // Markdown audit and conform passes) — not checked here (SHAPE-16 ownership split).

  // ── capability detection ──────────────────────────────────────────────────────
  const vitestFile = [
    'vitest.config.ts',
    'vitest.config.js',
    'vitest.config.mts',
    'vitest.config.cts',
    'vitest.config.mjs',
    'vitest.config.cjs'
  ].find((f) => has(f))
  const hasTests = Boolean(vitestFile) || Boolean(scripts.test)
  const buildScript = scripts.build ?? ''
  const hasBuild = has('tsconfig.build.json') || /\btsc\b/.test(buildScript)
  const hasCli = isDir('src', 'cli')
  const envExample = ['.env.example', '.env.development.example'].find((f) => has(f))
  const usesLoadEnv = (() => {
    const cfg = read('src', 'config', 'index.ts')
    return cfg.includes('process.loadEnvFile')
  })()
  const hasEnv = Boolean(envExample) || usesLoadEnv

  // ── core: capability tails + the bare test idiom (§2) ─────────────────────────
  // A repo with tests exposes the bare `test` idiom (the whole *.test.ts suite), run in CI
  // after `ki repo audit`. Compiled builds remain the separate bare `build` lifecycle command.
  if (hasTests && !scripts.test)
    add(
      'FAIL',
      'SCR-7',
      'repo has tests but no bare "test" script (the whole suite, run after native audit)',
      STD,
      'package.json'
    )
  else if (hasTests) add('PASS', 'SCR-7', 'bare "test" idiom present', STD, 'package.json')

  // ── capability: tests ─────────────────────────────────────────────────────────
  // Vitest is the recommended runner and the ONLY one the coverage rules below apply to,
  // but it is not mandated: a repo may run its self-tests another way (the harness runs
  // standalone *.test.ts checker scripts via the bare `test` idiom). The vitest key-shape +
  // 100%-coverage checks fire only when a vitest.config.* is actually present.
  if (vitestFile) {
    const wantTest: Record<string, string> = {
      test: 'vitest run',
      'test:coverage': 'vitest run --coverage',
      'test:watch': 'vitest'
    }
    for (const [k, v] of Object.entries(wantTest)) {
      if (!scripts[k])
        add(
          'WARN',
          'TEST-1',
          `test capability: script "${k}" missing (expected ${JSON.stringify(v)})`,
          STD,
          'package.json'
        )
      else
        scripts[k] === v
          ? add('PASS', 'TEST-1', `${k} = ${JSON.stringify(v)}`, STD, 'package.json')
          : add(
              'FAIL',
              'TEST-1',
              `${k} should be ${JSON.stringify(v)}, got ${JSON.stringify(scripts[k])}`,
              STD,
              'package.json'
            )
    }
    {
      const vc = read(vitestFile)
      const objectAt = (source: string, open: number): string | undefined => {
        if (source[open] !== '{') return undefined
        let depth = 0
        let quote = ''
        let escapedChar = false
        let lineComment = false
        let blockComment = false
        for (let i = open; i < source.length; i += 1) {
          const char = source[i]
          const next = source[i + 1]
          if (lineComment) {
            if (char === '\n') lineComment = false
            continue
          }
          if (blockComment) {
            if (char === '*' && next === '/') {
              blockComment = false
              i += 1
            }
            continue
          }
          if (quote) {
            if (escapedChar) escapedChar = false
            else if (char === '\\') escapedChar = true
            else if (char === quote) quote = ''
            continue
          }
          if (char === '/' && next === '/') {
            lineComment = true
            i += 1
            continue
          }
          if (char === '/' && next === '*') {
            blockComment = true
            i += 1
            continue
          }
          if (char === '"' || char === "'" || char === '`') {
            quote = char
            continue
          }
          if (char === '{') depth += 1
          if (char === '}') {
            depth -= 1
            if (depth === 0) return source.slice(open, i + 1)
          }
        }
        return undefined
      }
      const maskNonCode = (source: string): string => {
        const masked = source.split('')
        let quote = ''
        let escapedChar = false
        let lineComment = false
        let blockComment = false
        for (let i = 0; i < source.length; i += 1) {
          const char = source[i]
          const next = source[i + 1]
          if (lineComment) {
            if (char === '\n') lineComment = false
            else masked[i] = ' '
            continue
          }
          if (blockComment) {
            masked[i] = ' '
            if (char === '*' && next === '/') {
              masked[i + 1] = ' '
              blockComment = false
              i += 1
            }
            continue
          }
          if (quote) {
            masked[i] = ' '
            if (escapedChar) escapedChar = false
            else if (char === '\\') escapedChar = true
            else if (char === quote) quote = ''
            continue
          }
          if (char === '/' && next === '/') {
            masked[i] = ' '
            masked[i + 1] = ' '
            lineComment = true
            i += 1
            continue
          }
          if (char === '/' && next === '*') {
            masked[i] = ' '
            masked[i + 1] = ' '
            blockComment = true
            i += 1
            continue
          }
          if (char === '"' || char === "'" || char === '`') {
            masked[i] = ' '
            quote = char
          }
        }
        return masked.join('')
      }
      const exportedConfig = (source: string): string | undefined => {
        const code = maskNonCode(source)
        const starts = [
          /\bexport\s+default\s+(?:defineConfig\s*\(\s*)?\{/m.exec(code),
          /\bmodule\.exports\s*=\s*(?:defineConfig\s*\(\s*)?\{/m.exec(code)
        ].filter((match): match is RegExpExecArray => Boolean(match))
        const start = starts.sort((a, b) => a.index - b.index)[0]
        if (!start) return undefined
        return objectAt(source, start.index + start[0].lastIndexOf('{'))
      }
      const directPropertyMatch = (
        source: string,
        property: string,
        valuePattern: string
      ): { index: number; match: RegExpExecArray } | undefined => {
        if (!source.startsWith('{')) return undefined
        const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const propertyStart = new RegExp(`^(?:["']${escaped}["']|${escaped})\\s*:\\s*${valuePattern}`)
        let depth = 0
        let quote = ''
        let escapedChar = false
        let lineComment = false
        let blockComment = false
        let expectsProperty = false
        for (let i = 0; i < source.length; i += 1) {
          const char = source[i]
          const next = source[i + 1]
          if (lineComment) {
            if (char === '\n') lineComment = false
            continue
          }
          if (blockComment) {
            if (char === '*' && next === '/') {
              blockComment = false
              i += 1
            }
            continue
          }
          if (quote) {
            if (escapedChar) escapedChar = false
            else if (char === '\\') escapedChar = true
            else if (char === quote) quote = ''
            continue
          }
          if (char === '/' && next === '/') {
            lineComment = true
            i += 1
            continue
          }
          if (char === '/' && next === '*') {
            blockComment = true
            i += 1
            continue
          }
          if (depth === 1 && expectsProperty && !/\s/.test(char)) {
            const match = propertyStart.exec(source.slice(i))
            if (match) return { index: i, match }
            expectsProperty = false
          }
          if (char === '"' || char === "'" || char === '`') {
            quote = char
            continue
          }
          if (char === '{') {
            depth += 1
            if (depth === 1) expectsProperty = true
            continue
          }
          if (char === '}') {
            depth -= 1
            continue
          }
          if (depth === 1 && char === ',') expectsProperty = true
        }
        return undefined
      }
      const directObjectProperty = (source: string, property: string): string | undefined => {
        const found = directPropertyMatch(source, property, '\\{')
        return found ? objectAt(source, found.index + found.match[0].lastIndexOf('{')) : undefined
      }
      const rootConfig = exportedConfig(vc)
      const testConfig = rootConfig ? directObjectProperty(rootConfig, 'test') : undefined
      const coverage = testConfig ? directObjectProperty(testConfig, 'coverage') : undefined
      const thresholds = coverage ? directObjectProperty(coverage, 'thresholds') : undefined
      const exactHundred = (metric: string): boolean => {
        if (!thresholds) return false
        return Boolean(directPropertyMatch(thresholds, metric, '100(?=\\s*[,}])'))
      }
      const covOk = ['lines', 'branches', 'functions', 'statements'].every(exactHundred)
      add(
        covOk ? 'PASS' : 'FAIL',
        'TEST-2',
        covOk
          ? 'coverage thresholds 100% on all four metrics'
          : 'coverage thresholds must be 100/100/100/100 (lines/functions/branches/statements)',
        STD,
        vitestFile
      )
      const excludesTest = /exclude\s*:/.test(vc) && /\*\*\/\*\.test\.ts/.test(vc)
      add(
        excludesTest ? 'PASS' : 'WARN',
        'TEST-3',
        excludesTest
          ? 'coverage excludes src/**/*.test.ts'
          : 'coverage should exclude src/**/*.test.ts (other excludes are artifact-specific)',
        STD,
        vitestFile
      )
      // monorepo shape (§0): per-workspace artifacts and test globs are scoped to the owning
      // workspace dir, never the repo root. Check the vitest reportsDirectory and include globs
      // sit under a declared workspace (mirrors the per-workspace tsc check above).
      if (workspaces.length) {
        const underWs = (p: string) => workspaces.some((w) => p === w || p.startsWith(`${w}/`))
        const rd = vc.match(/reportsDirectory\s*:\s*['"]([^'"]+)['"]/)?.[1]
        add(
          rd && underWs(rd) ? 'PASS' : 'WARN',
          'TEST-4',
          rd && underWs(rd)
            ? `monorepo: coverage reportsDirectory "${rd}" is under a workspace`
            : `monorepo (§0): set the vitest coverage reportsDirectory under the owning workspace (e.g. "site/coverage"), not the repo root — ${rd ? `got "${rd}"` : 'none set (defaults to root coverage/)'}`,
          STD,
          vitestFile
        )
        const globs = [...vc.matchAll(/include\s*:\s*\[([^\]]*)\]/g)].flatMap((m) =>
          [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1])
        )
        const escaped = globs.filter((g) => !underWs(g))
        if (escaped.length)
          add(
            'WARN',
            'TEST-4',
            `monorepo (§0): vitest include glob(s) not under a workspace dir: ${escaped.join(', ')} — scope tests/coverage to the owning workspace (e.g. site/scripts/**/*.test.ts)`,
            STD,
            vitestFile
          )
      }
    }
    if (scripts['test:coverage']) await runCheck('TEST-5', 'test:coverage', 'bun run test:coverage', STD)
  } else if (scripts.test) {
    add(
      'INFO',
      'TEST-1',
      'non-vitest test runner (bare `test` idiom) — the vitest key-shape + coverage rules do not apply',
      STD,
      'package.json'
    )
  } else {
    add('NOT_APPLICABLE', 'TEST-1', 'no test capability (no vitest.config / test script) — not applicable', STD)
  }

  // ── capability: compiled build + the cli-chmod rule ───────────────────────────
  if (hasBuild) {
    buildScript.startsWith('tsc -p tsconfig.build.json')
      ? add('PASS', 'BUILD-1', 'build = tsc -p tsconfig.build.json', STD, 'package.json')
      : add(
          'FAIL',
          'BUILD-1',
          `build should start with "tsc -p tsconfig.build.json", got ${JSON.stringify(buildScript)}`,
          STD,
          'package.json'
        )
    Array.isArray(pkg.files) && (pkg.files as string[]).includes('dist')
      ? add('PASS', 'BUILD-1', 'files includes "dist"', STD, 'package.json')
      : add('FAIL', 'BUILD-1', 'files should include "dist"', STD, 'package.json')
    // tsconfig.build.json shape
    const tb = read('tsconfig.build.json')
    if (!tb) add('FAIL', 'BUILD-2', 'compiled build but tsconfig.build.json missing', STD, 'tsconfig.build.json')
    else {
      const tbChecks: [string, RegExp][] = [
        ['extends ./tsconfig.json', /"extends"\s*:\s*"\.\/tsconfig\.json"/],
        ['noEmit: false', /"noEmit"\s*:\s*false/],
        ['declaration: true', /"declaration"\s*:\s*true/],
        ['declarationMap: true', /"declarationMap"\s*:\s*true/],
        ['outDir ./dist', /"outDir"\s*:\s*"\.\/dist"/],
        ['rootDir ./src', /"rootDir"\s*:\s*"\.\/src"/],
        ['allowImportingTsExtensions: false', /"allowImportingTsExtensions"\s*:\s*false/],
        ['noUncheckedIndexedAccess: true', /"noUncheckedIndexedAccess"\s*:\s*true/],
        ['excludes **/*.test.ts', /\*\*\/\*\.test\.ts/]
      ]
      for (const [label, re] of tbChecks)
        re.test(tb)
          ? add('PASS', 'BUILD-2', `tsconfig.build.json ${label}`, STD, 'tsconfig.build.json')
          : add('WARN', 'BUILD-2', `tsconfig.build.json: expected ${label}`, STD, 'tsconfig.build.json')
    }
    // the richer shared base lives in the compiled-TS profile — WARN, not FAIL
    const tsBase: [string, RegExp][] = [
      ['target es2024', /"target"\s*:\s*"es2024"/i],
      ['verbatimModuleSyntax: true', /"verbatimModuleSyntax"\s*:\s*true/],
      ['noUnusedLocals: true', /"noUnusedLocals"\s*:\s*true/]
    ]
    for (const [label, re] of tsBase)
      re.test(ts)
        ? add('PASS', 'BUILD-3', `tsconfig.json (shared base) ${label}`, STD, 'tsconfig.json')
        : add('WARN', 'BUILD-3', `tsconfig.json (shared base) should set ${label}`, STD, 'tsconfig.json')
    // CLI chmod rule: build chmods EXACTLY dist/cli/cli.js iff src/cli/, and nothing else.
    const chmodTargets = [...buildScript.matchAll(/chmod\s+\+x\s+([^&|;]+)/g)]
      .flatMap((m) => m[1].trim().split(/\s+/))
      .filter(Boolean)
    const allowed = hasCli ? ['dist/cli/cli.js'] : []
    const unexpected = chmodTargets.filter((t) => !allowed.includes(t))
    const missing = allowed.filter((t) => !chmodTargets.includes(t))
    if (unexpected.length)
      add(
        'FAIL',
        'BUILD-4',
        `build chmods unexpected target(s): ${unexpected.join(', ')} — chmod only dist/cli/cli.js (iff src/cli/), never the server bin`,
        STD,
        'package.json'
      )
    if (missing.length)
      add('WARN', 'BUILD-4', `src/cli/ exists but build does not chmod +x ${missing.join(', ')}`, STD, 'package.json')
    if (!unexpected.length && !missing.length)
      add(
        'PASS',
        'BUILD-4',
        hasCli ? 'build chmods exactly dist/cli/cli.js' : 'build chmods nothing (no src/cli/) — correct',
        STD,
        'package.json'
      )
  } else {
    add('NOT_APPLICABLE', 'BUILD-1', 'no compiled-tsc build capability — not applicable', STD)
  }

  // ── capability: env config ────────────────────────────────────────────────────
  if (hasEnv) {
    envExample
      ? add('PASS', 'ENV-1', `${envExample} present`, STD, envExample)
      : add('WARN', 'ENV-1', 'loads env (process.loadEnvFile) but no .env*.example template committed', STD)
    // NODE_ENV=development must appear only in dev/inspect scripts
    const devKeys = (k: string) => /:(dev|inspect)\b/.test(k) || k.endsWith(':dev') || k.endsWith(':inspect')
    const leaks = Object.entries(scripts).filter(([k, v]) => v.includes('NODE_ENV=development') && !devKeys(k))
    leaks.length
      ? add(
          'FAIL',
          'ENV-2',
          `NODE_ENV=development outside a dev/inspect script: ${leaks.map(([k]) => k).join(', ')}`,
          STD,
          'package.json'
        )
      : add('PASS', 'ENV-2', 'NODE_ENV=development only in dev/inspect scripts', STD, 'package.json')
  } else {
    add('NOT_APPLICABLE', 'ENV-1', 'no env capability — not applicable', STD)
  }

  // ── core: .ki-config.toml qualified ki-engineering table ────────
  const ki = read('.ki-config.toml')
  const engineeringHeader = '[skills.ki-engineering]'
  if (!ki) add('WARN', 'TOML-1', '.ki-config.toml missing (ki-repo owns the contract)', STD, '.ki-config.toml')
  else if (!/^\[skills\.ki-engineering\]/m.test(ki)) {
    add(
      'WARN',
      'TOML-1',
      `no ${engineeringHeader} table — add it to mark this repo as governed by the engineering standard`,
      STD,
      '.ki-config.toml'
    )
  } else {
    add('PASS', 'TOML-1', `${engineeringHeader} table present`, STD, '.ki-config.toml')
    // validate-down: the table is a conformance marker only — it carries no keys. Repo
    // shape (flat vs monorepo) is read from package.json `workspaces` (§0), a standard Bun
    // convention, not a bespoke key here. Any key directly under the table is drift.
    const body = ki.split(/^\[skills\.ki-engineering\]/m)[1]?.split(/^\[/m)[0] ?? ''
    const KNOWN = new Set<string>() // no keys defined; only a [skills.ki-engineering.checks] sub-table is allowed
    for (const m of body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=/gm)) {
      KNOWN.has(m[1])
        ? add('PASS', 'TOML-2', `known key ${m[1]}`, STD, '.ki-config.toml')
        : add(
            'WARN',
            'TOML-2',
            `unknown key under ${engineeringHeader}: ${m[1]} (validate-down)`,
            STD,
            '.ki-config.toml'
          )
    }
    for (const record of inspectEngineeringCheckRecords(ki))
      add(record.level, 'TOML-3', record.message, STD, '.ki-config.toml')
  }

  return findings.map(({ level, area, msg, file }) => ({
    level,
    code: area,
    message: msg,
    ...(file ? { subject: file } : {})
  }))
}
