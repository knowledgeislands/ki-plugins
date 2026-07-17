#!/usr/bin/env bun
/**
 * Mechanical auditor for a Knowledge Islands site's Cloudflare hosting.
 *
 *   bun scripts/audit.ts <repo-path>   # or: node --experimental-strip-types
 *   bun scripts/audit.ts --educate        # print the default [ki-website-cloudflare] block
 *
 * Checks the HOSTING DELTA the `ki-website-cloudflare` skill codifies — the SITE
 * Worker that serves the built dist/ via Workers + Static Assets. It does NOT build the dist/
 * (that is `ki-website`; run audit.ts first) nor check the common
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
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
// Cited finding: `area` is the rubric code (WCF-N, references/audit-rubric.md), `ref`
// the reference-doc pointer, `file` the path a file-scoped finding concerns.
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

// Reference-doc pointers (relative to the skill root) cited on findings.
const STD = 'references/cloudflare-hosting-standard.md'
const RUBRIC = 'references/audit-rubric.md'

// `.ki-config.toml` is a shared per-repo file; this skill owns the
// [ki-website-cloudflare] table. The default block (written by `--educate`)
// is the authoritative key list — the table header is the opt-in marker; `site-root`
// is the one declarable key (validate-down warns on anything else under the table).
const KI_SECTION = 'ki-website-cloudflare'
const KI_DEFAULT = `# ${KI_SECTION} — opt-in marker: presence of this table opts the repo into the
# Workers + Static Assets hosting standard (serving the built dist/).
[${KI_SECTION}]
# site-root is the path (relative to the repo root) where wrangler.jsonc lives:
# "." for the flat layout, "site" for the subfolder layout. Optional — omit to let
# the auditor discover it (it scans the repo root and one level of subdirs).
# site-root = "."
`
if (process.argv.slice(2).includes('--educate')) {
  process.stdout.write(KI_DEFAULT)
  process.exit(0)
}

const repo = process.argv[2]
if (!repo || !existsSync(repo)) {
  console.error('usage: audit.ts <repo-path>   (path must exist)')
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
  add('NA', 'WCF-1', 'no wrangler config and no [ki-website-cloudflare] table — repo is not Cloudflare-hosted; skip this audit', STD)
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
    'WCF-1',
    `no site Worker: no wrangler config with an "assets" block serving dist/ (found ${configs.length || 'none'}: ${configs.map((c) => c.rel).join(', ') || '—'})`,
    STD
  )
} else if (siteCfgs.length > 1) {
  add(
    'WARN',
    'WCF-3',
    `more than one wrangler config has an "assets" block: ${siteCfgs.map((c) => c.rel).join(', ')} — expected one site Worker`,
    STD
  )
}

const site = siteCfgs[0]
if (site) {
  add('PASS', 'WCF-1', 'site Worker config present', STD, site.rel)
  const t = site.text

  // assets.directory → dist/ seam
  const dir = t.match(/"directory"\s*:\s*"([^"]+)"/)?.[1] ?? t.match(/directory\s*=\s*"([^"]+)"/)?.[1]
  if (!dir) add('FAIL', 'WCF-4', 'assets block has no "directory" (the dist/ seam)', STD, site.rel)
  else if (/dist\/?$/.test(dir)) add('PASS', 'WCF-4', `assets.directory = "${dir}" (points at dist/)`, STD, site.rel)
  else add('WARN', 'WCF-4', `assets.directory = "${dir}" — expected it to point at the build's dist/`, STD, site.rel)

  // required fields
  const hasName = /"name"\s*:/.test(t) || /^\s*name\s*=/m.test(t)
  add(hasName ? 'PASS' : 'FAIL', 'WCF-8', hasName ? 'name present' : 'no name', STD, site.rel)
  const hasCompat = /"compatibility_date"\s*:\s*"\d{4}-\d{2}-\d{2}"/.test(t) || /compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"/.test(t)
  add(
    hasCompat ? 'PASS' : 'WARN',
    'WCF-8',
    hasCompat ? 'compatibility_date pinned (YYYY-MM-DD)' : 'no pinned compatibility_date',
    STD,
    site.rel
  )
  const obs = /"observability"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/.test(t) || /\[observability\][\s\S]*?enabled\s*=\s*true/.test(t)
  add(
    obs ? 'PASS' : 'WARN',
    'WCF-9',
    obs ? 'observability.enabled = true' : 'observability not enabled (logs only via wrangler tail)',
    STD,
    site.rel
  )
  const customDomain = /"custom_domain"\s*:\s*true/.test(t) || /custom_domain\s*=\s*true/.test(t)
  add(
    customDomain ? 'PASS' : 'WARN',
    'WCF-10',
    customDomain ? 'routes use custom_domain' : 'no custom_domain route (site may be on *.workers.dev — verify)',
    STD,
    site.rel
  )
}

// ── companions: noted, not flagged ────────────────────────────────────────────
if (companions.length) {
  add(
    'PASS',
    'WCF-19',
    `companion Worker(s) noted, out of scope (route to cloudflare/wrangler): ${companions.map((c) => c.rel).join(', ')}`,
    STD
  )
}

// ── scripts: the SITE's wrangler deploy, never pages deploy ───────────────────
// Target the site deploy (ki:site:deploy | deploy), not a companion's (ingress:deploy, bot:deploy).
const deployKey = scripts['ki:site:deploy'] ? 'ki:site:deploy' : scripts.deploy ? 'deploy' : ''
const deployOk = deployKey !== '' && /wrangler\s+deploy/.test(scripts[deployKey])
add(
  deployOk ? 'PASS' : 'WARN',
  'WCF-13',
  deployOk ? `site deploy script: ${deployKey} → wrangler deploy` : 'no (site:)deploy script running `wrangler deploy`',
  STD,
  'package.json'
)
const pagesDeploy = Object.entries(scripts).find(([, v]) => /wrangler\s+pages\s+deploy/.test(v))
add(
  pagesDeploy ? 'FAIL' : 'PASS',
  'WCF-2',
  pagesDeploy
    ? `uses "wrangler pages deploy" (${pagesDeploy[0]}) — migrate to Workers + Static Assets`
    : 'no "wrangler pages deploy" (Workers + Static Assets)',
  STD,
  'package.json'
)
// ── scripts: the local preview (build, then wrangler dev against dist/) ────────
const previewKey = scripts['ki:site:preview'] ? 'ki:site:preview' : scripts.preview ? 'preview' : ''
previewKey && /wrangler\s+dev/.test(scripts[previewKey])
  ? add('PASS', 'WCF-14', `site preview script: ${previewKey} → wrangler dev`, STD, 'package.json')
  : add(
      'WARN',
      'WCF-14',
      'no ki:site:preview script running `wrangler dev` (local Workers preview of the built dist/)',
      STD,
      'package.json'
    )

// ── gitignore: dist/ + .wrangler/ ─────────────────────────────────────────────
const gitignore = read('.gitignore')
const distIgnored = /^\s*\/?dist\/?\s*$/m.test(gitignore)
add(distIgnored ? 'PASS' : 'WARN', 'WCF-6', distIgnored ? 'dist/ is gitignored' : 'dist/ not in .gitignore', STD, '.gitignore')
const wranglerIgnored = /\.wrangler/.test(gitignore)
add(
  wranglerIgnored ? 'PASS' : 'WARN',
  'WCF-6',
  wranglerIgnored ? '.wrangler/ is gitignored' : '.wrangler/ not in .gitignore',
  STD,
  '.gitignore'
)

// ── .ki-config.toml opt-in table + site-root (validate-down) ──────────────────
add(
  kiTable ? 'PASS' : 'WARN',
  'WCF-20',
  kiTable
    ? `[${KI_SECTION}] table present in .ki-config.toml`
    : `no [${KI_SECTION}] table in .ki-config.toml (run --educate to scaffold it)`,
  STD,
  '.ki-config.toml'
)
if (kiTable) {
  // Read ONLY this skill's table; recognise `site-root`, warn on anything else
  // (validate-down). `^\[` ends the slice at the next table header.
  const body = ki.split(new RegExp(`^\\[${KI_SECTION}\\]`, 'm'))[1]?.split(/^\[/m)[0] ?? ''
  let siteRoot: string | null = null
  for (const m of body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.+?)\s*$/gm)) {
    if (m[1] === 'site-root') siteRoot = m[2].replace(/^["']|["']$/g, '')
    else
      add(
        'WARN',
        'WCF-21',
        `unknown key under [${KI_SECTION}]: ${m[1]} (validate-down — only site-root is declarable)`,
        STD,
        '.ki-config.toml'
      )
  }
  // A declared site-root is a reviewable choice — check it actually holds a wrangler config.
  if (siteRoot !== null) {
    const dirs = new Set(configs.map((c) => dirname(c.rel)))
    add(
      dirs.has(siteRoot) ? 'PASS' : 'WARN',
      'WCF-21',
      dirs.has(siteRoot)
        ? `declared site-root "${siteRoot}" holds a wrangler config`
        : `declared site-root "${siteRoot}" has no wrangler config (stale declaration, or the config lives elsewhere)`,
      STD,
      '.ki-config.toml'
    )
  }
}

report()

// ── report ────────────────────────────────────────────────────────────────────
function report(): never {
  add('INFO', 'WCF-22', 'hosting delta only — compose with audit.ts (toolchain) + audit.ts (the dist/ build) for full coverage', RUBRIC)
  add('ADVISORY', 'WCF-23', 'mechanical layer only — apply the [J] criteria by reading', RUBRIC)
  emit(
    findings,
    repo,
    'cloudflare-hosting',
    `Cloudflare hosting audit — ${name}  (${repo})`,
    'Hosting delta only — also run audit.ts (toolchain) + audit.ts (the dist/ build) + the rubric judgment pass.'
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
    na: n('NA'),
    pass: n('PASS')
  }
  const tally = `FAIL=${summary.fail} WARN=${summary.warn} POLISH=${summary.polish} PASS=${summary.pass} ADVISORY=${summary.advisory} NA=${summary.na}`
  const stamp = new Date().toISOString()

  if (report) {
    mkdirSync(reportDir, { recursive: true })
    const body = ORDER.flatMap((l) => {
      const rows = items.filter((f) => f.level === l)
      return rows.length
        ? [
            '',
            `## ${ICON[l]} ${l} (${rows.length})`,
            ...rows.map((r) => `- [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
          ]
        : []
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
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (footer) console.log(footer)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-website-cloudflare CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}
