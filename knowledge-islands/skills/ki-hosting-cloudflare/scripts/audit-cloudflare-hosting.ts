#!/usr/bin/env bun
/**
 * Mechanical auditor for a Knowledge Islands site's Cloudflare hosting.
 *
 *   bun scripts/audit-cloudflare-hosting.ts <repo-path>   # or: node --experimental-strip-types
 *   bun scripts/audit-cloudflare-hosting.ts --init        # print the default [ki-hosting-cloudflare] block
 *
 * Checks the HOSTING DELTA the `ki-hosting-cloudflare` skill codifies — the SITE
 * Worker that serves the built dist/ via Workers + Static Assets. It does NOT build the dist/
 * (that is `ki-websites-11ty`; run audit-websites.ts first) nor check the common
 * toolchain (`ki-engineering`). It scopes to the SITE Worker (the wrangler config
 * carrying an `assets` block); a companion Worker (a `main` entry, no `assets` — a bot, ingress,
 * API) is NOTED, not flagged, and routes to the generic cloudflare/wrangler skills. The judgment
 * items (domains correct, build-before-deploy, CI wired) need a read — see references/audit-rubric.md.
 *
 * Output is grouped pass/warn/fail; exit non-zero if any FAIL. No dependencies — Node/Bun builtins only.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'SKIP' | 'PASS'
type Finding = { level: Level; area: string; msg: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'SKIP', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️ ', SKIP: '⊘', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string) => findings.push({ level, area, msg })

// `.ki-config.toml` is a shared per-repo file; this skill owns the
// [ki-hosting-cloudflare] table. The default block (written by `--init`)
// is the authoritative key list — the table header is the opt-in marker; `site-root`
// is the one declarable key (validate-down warns on anything else under the table).
const KI_SECTION = 'ki-hosting-cloudflare'
const KI_DEFAULT = `# ${KI_SECTION} — opt-in marker: presence of this table opts the repo into the
# Workers + Static Assets hosting standard (serving the built dist/).
[${KI_SECTION}]
# site-root is the path (relative to the repo root) where wrangler.jsonc lives:
# "." for the flat layout, "site" for the subfolder layout. Optional — omit to let
# the auditor discover it (it scans the repo root and one level of subdirs).
# site-root = "."
`
if (process.argv.slice(2).includes('--init')) {
  process.stdout.write(KI_DEFAULT)
  process.exit(0)
}

const repo = process.argv[2]
if (!repo || !existsSync(repo)) {
  console.error('usage: audit-cloudflare-hosting.ts <repo-path>   (path must exist)')
  process.exit(2)
}
const at = (...p: string[]) => join(repo, ...p)
const read = (...p: string[]): string => {
  try {
    return readFileSync(at(...p), 'utf8')
  } catch {
    return ''
  }
}
const WRANGLER_NAMES = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml']

// ── collect wrangler configs: repo root + one level of subdirs ────────────────
type Cfg = { rel: string; text: string }
const configs: Cfg[] = []
const collectFrom = (subdir: string) => {
  for (const n of WRANGLER_NAMES) {
    const rel = subdir ? join(subdir, n) : n
    if (existsSync(at(rel))) configs.push({ rel, text: read(rel) })
  }
}
collectFrom('')
for (const e of existsSync(repo) ? readdirSync(repo, { withFileTypes: true }) : []) {
  if (!e.isDirectory()) continue
  if (['node_modules', '.git', 'dist', '.wrangler'].includes(e.name)) continue
  collectFrom(e.name)
}

const name = (() => {
  try {
    return String((JSON.parse(read('package.json')) as { name?: string }).name ?? basename(repo))
  } catch {
    return basename(repo)
  }
})()
const ki = read('.ki-config.toml')
const kiTable = new RegExp(`^\\[${KI_SECTION}\\]`, 'm').test(ki)
const scripts = (() => {
  try {
    return ((JSON.parse(read('package.json')) as { scripts?: Record<string, string> }).scripts ?? {}) as Record<string, string>
  } catch {
    return {} as Record<string, string>
  }
})()

// ── not-hosted short-circuit ──────────────────────────────────────────────────
if (!configs.length && !kiTable) {
  add('WARN', 'model', 'no wrangler config and no [ki-hosting-cloudflare] table — repo is not Cloudflare-hosted; skip this audit')
  report()
}

// ── classify: site Worker (has assets) vs companion (has main, no assets) ─────
const hasAssets = (t: string) => /"assets"\s*:/.test(t) || /\[assets\]|assets\s*=/.test(t)
const hasMain = (t: string) => /"main"\s*:/.test(t) || /^\s*main\s*=/m.test(t)
const siteCfgs = configs.filter((c) => hasAssets(c.text))
const companions = configs.filter((c) => !hasAssets(c.text) && hasMain(c.text))

if (!siteCfgs.length) {
  add(
    'FAIL',
    'model',
    `no site Worker: no wrangler config with an "assets" block serving dist/ (found ${configs.length || 'none'}: ${configs.map((c) => c.rel).join(', ') || '—'})`
  )
} else if (siteCfgs.length > 1) {
  add(
    'WARN',
    'model',
    `more than one wrangler config has an "assets" block: ${siteCfgs.map((c) => c.rel).join(', ')} — expected one site Worker`
  )
}

const site = siteCfgs[0]
if (site) {
  add('PASS', 'model', `site Worker config: ${site.rel}`)
  const t = site.text

  // assets.directory → dist/ seam
  const dir = t.match(/"directory"\s*:\s*"([^"]+)"/)?.[1] ?? t.match(/directory\s*=\s*"([^"]+)"/)?.[1]
  if (!dir) add('FAIL', 'seam', 'assets block has no "directory" (the dist/ seam)')
  else if (/dist\/?$/.test(dir)) add('PASS', 'seam', `assets.directory = "${dir}" (points at dist/)`)
  else add('WARN', 'seam', `assets.directory = "${dir}" — expected it to point at the build's dist/`)

  // required fields
  const hasName = /"name"\s*:/.test(t) || /^\s*name\s*=/m.test(t)
  add(hasName ? 'PASS' : 'FAIL', 'config', hasName ? 'name present' : 'no name')
  const hasCompat = /"compatibility_date"\s*:\s*"\d{4}-\d{2}-\d{2}"/.test(t) || /compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"/.test(t)
  add(hasCompat ? 'PASS' : 'WARN', 'config', hasCompat ? 'compatibility_date pinned (YYYY-MM-DD)' : 'no pinned compatibility_date')
  const obs = /"observability"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/.test(t) || /\[observability\][\s\S]*?enabled\s*=\s*true/.test(t)
  add(obs ? 'PASS' : 'WARN', 'config', obs ? 'observability.enabled = true' : 'observability not enabled (logs only via wrangler tail)')
  const customDomain = /"custom_domain"\s*:\s*true/.test(t) || /custom_domain\s*=\s*true/.test(t)
  add(
    customDomain ? 'PASS' : 'WARN',
    'config',
    customDomain ? 'routes use custom_domain' : 'no custom_domain route (site may be on *.workers.dev — verify)'
  )
}

// ── companions: noted, not flagged ────────────────────────────────────────────
if (companions.length) {
  add(
    'PASS',
    'boundaries',
    `companion Worker(s) noted, out of scope (route to cloudflare/wrangler): ${companions.map((c) => c.rel).join(', ')}`
  )
}

// ── scripts: the SITE's wrangler deploy, never pages deploy ───────────────────
// Target the site deploy (ki:site:deploy | deploy), not a companion's (ingress:deploy, bot:deploy).
const deployKey = scripts['ki:site:deploy'] ? 'ki:site:deploy' : scripts.deploy ? 'deploy' : ''
const deployOk = deployKey !== '' && /wrangler\s+deploy/.test(scripts[deployKey])
add(
  deployOk ? 'PASS' : 'WARN',
  'scripts',
  deployOk ? `site deploy script: ${deployKey} → wrangler deploy` : 'no (site:)deploy script running `wrangler deploy`'
)
const pagesDeploy = Object.entries(scripts).find(([, v]) => /wrangler\s+pages\s+deploy/.test(v))
add(
  pagesDeploy ? 'FAIL' : 'PASS',
  'model',
  pagesDeploy
    ? `uses "wrangler pages deploy" (${pagesDeploy[0]}) — migrate to Workers + Static Assets`
    : 'no "wrangler pages deploy" (Workers + Static Assets)'
)
// ── scripts: the local preview (build, then wrangler dev against dist/) ────────
const previewKey = scripts['ki:site:preview'] ? 'ki:site:preview' : scripts.preview ? 'preview' : ''
previewKey && /wrangler\s+dev/.test(scripts[previewKey])
  ? add('PASS', 'scripts', `site preview script: ${previewKey} → wrangler dev`)
  : add('WARN', 'scripts', 'no ki:site:preview script running `wrangler dev` (local Workers preview of the built dist/)')

// ── gitignore: dist/ + .wrangler/ ─────────────────────────────────────────────
const gitignore = read('.gitignore')
const distIgnored = /^\s*\/?dist\/?\s*$/m.test(gitignore)
add(distIgnored ? 'PASS' : 'WARN', 'seam', distIgnored ? 'dist/ is gitignored' : 'dist/ not in .gitignore')
const wranglerIgnored = /\.wrangler/.test(gitignore)
add(wranglerIgnored ? 'PASS' : 'WARN', 'seam', wranglerIgnored ? '.wrangler/ is gitignored' : '.wrangler/ not in .gitignore')

// ── .ki-config.toml opt-in table + site-root (validate-down) ──────────────────
add(
  kiTable ? 'PASS' : 'WARN',
  'config',
  kiTable ? `[${KI_SECTION}] table present in .ki-config.toml` : `no [${KI_SECTION}] table in .ki-config.toml (run --init to scaffold it)`
)
if (kiTable) {
  // Read ONLY this skill's table; recognise `site-root`, warn on anything else
  // (validate-down). `^\[` ends the slice at the next table header.
  const body = ki.split(new RegExp(`^\\[${KI_SECTION}\\]`, 'm'))[1]?.split(/^\[/m)[0] ?? ''
  let siteRoot: string | null = null
  for (const m of body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.+?)\s*$/gm)) {
    if (m[1] === 'site-root') siteRoot = m[2].replace(/^["']|["']$/g, '')
    else add('WARN', 'config', `unknown key under [${KI_SECTION}]: ${m[1]} (validate-down — only site-root is declarable)`)
  }
  // A declared site-root is a reviewable choice — check it actually holds a wrangler config.
  if (siteRoot !== null) {
    const dirs = new Set(configs.map((c) => dirname(c.rel)))
    add(
      dirs.has(siteRoot) ? 'PASS' : 'WARN',
      'config',
      dirs.has(siteRoot)
        ? `declared site-root "${siteRoot}" holds a wrangler config`
        : `declared site-root "${siteRoot}" has no wrangler config (stale declaration, or the config lives elsewhere)`
    )
  }
}

report()

// ── report ────────────────────────────────────────────────────────────────────
function report(): never {
  add(
    'INFO',
    'scope',
    'hosting delta only — compose with audit-engineering.ts (toolchain) + audit-websites.ts (the dist/ build) for full coverage'
  )
  add('ADVISORY', 'judgment', 'mechanical layer only — apply the [J] criteria in references/audit-rubric.md by reading')
  emit(
    findings,
    repo,
    'cloudflare-hosting',
    `Cloudflare hosting audit — ${name}  (${repo})`,
    'Hosting delta only — also run audit-engineering.ts (toolchain) + audit-websites.ts (the dist/ build) + the rubric judgment pass.'
  )
}

function emit(items: Finding[], target: string, concern: string, title: string, footer: string): never {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const ri = argv.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && argv[ri + 1] && !argv[ri + 1].startsWith('-') ? argv[ri + 1] : join(target, '.ki-meta', 'audits')

  const n = (l: Level): number => items.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    skip: n('SKIP'),
    pass: n('PASS')
  }
  const tally = `${summary.fail} fail · ${summary.warn} warn · ${summary.polish} polish · ${summary.pass} pass  ·  ${summary.advisory} advisory · ${summary.skip} skip`
  const stamp = new Date().toISOString()

  if (report) {
    mkdirSync(reportDir, { recursive: true })
    const body = ORDER.flatMap((l) => {
      const rows = items.filter((f) => f.level === l)
      return rows.length ? ['', `## ${ICON[l]} ${l} (${rows.length})`, ...rows.map((r) => `- [${r.area}] ${r.msg}`)] : []
    })
    writeFileSync(join(reportDir, `${concern}.md`), [`# ${concern} audit — ${target}`, '', `_${stamp}_`, '', tally, ...body, ''].join('\n'))
    writeFileSync(
      join(reportDir, `${concern}.json`),
      `${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`
    )
  }

  if (json) {
    process.stdout.write(`${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`)
  } else {
    console.log(`\n${title}\n${'─'.repeat(60)}`)
    for (const l of ORDER) {
      const rows = items.filter((f) => f.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}] ${r.msg}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (footer) console.log(footer)
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}
