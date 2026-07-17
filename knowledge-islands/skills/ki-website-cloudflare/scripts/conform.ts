#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-website-cloudflare hosting standard.
 *
 * This is an honest normalize-only conform: almost everything the auditor
 * (audit.ts) flags is a JUDGMENT call — the site name, the pinned
 * compatibility_date, where dist/ actually lives, which custom domains the site
 * answers on, whether a Pages deploy should migrate — none of which a script may
 * guess. So this fixer touches only the handful of findings that are unambiguous
 * and reversible, and PRINTS everything else as a manual TODO drawn from the
 * audit's own categories.
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                       # print the plan, mutate nothing
 *   --json                          # emit the shared finding wrapper instead of prose
 *
 * `--json` reports the same cited-finding wrapper audit emits, so the aggregate
 * renders conform and audit identically: each action becomes a finding on the
 * shared ladder (file written/overwritten/fixed → POLISH, already-canonical →
 * PASS, gate still failing → FAIL, judgment / manual-TODO handoff → ADVISORY),
 * carrying the same rubric code (area) + reference (ref) as the matching audit
 * check, and file when path-specific. `--json` governs *reporting*; `--dry-run`
 * governs *writing* — the two compose (a --json run still writes unless --dry-run).
 *
 * Target detection (wrangler-config collection, the assets/main split, the
 * ki-config opt-in table, the deploy/preview script keys) is COPIED from
 * audit.ts, never imported — the composition-only rule keeps each script valid
 * standalone. Kept in lockstep with audit.ts (same source of truth).
 *
 * Fixes (unambiguous + reversible only):
 *   - .gitignore: append `dist/` and/or `.wrangler/` when missing (§2/§4 seam).
 *   - package.json: add a missing site deploy script key — value DERIVED from the
 *     discovered site-config directory (`bunx wrangler deploy`, prefixed
 *     `cd <dir> && …` for a subfolder layout), never invented.
 *   - wrangler.jsonc/.json: insert the canonical `observability: { enabled: true }`
 *     field when absent (§3 — always-true, house-canonical).
 *
 * Deliberately NEVER touches (judgment → manual TODOs):
 *   - The site `name`, the `compatibility_date` value, `assets.directory` — all
 *     site-specific values a script cannot know (§3/§2).
 *   - `routes` / `custom_domain` — the site's real domains (§3).
 *   - A `wrangler pages deploy` migration — a model change, not a field edit (§1).
 *   - The `ki:site:preview` / `ki:site:clean` scripts — preview chains
 *     `ki-website`'s build (a cross-skill reference), clean's exact rm form is a
 *     style call (§4).
 *   - Authoring a whole wrangler config, or the [ki-website-cloudflare] opt-in
 *     table, from scratch — opting a repo into the hosting standard is a decision.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on an
 * unrecoverable error; findings/fixes never fail the run.
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const KI_SECTION = 'ki-website-cloudflare'
const WRANGLER_NAMES = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml']
const SKIP_DIRS = ['node_modules', '.git', 'dist', '.wrangler']
const hasAssets = (t: string) => /"assets"\s*:/.test(t) || /\[assets\]|assets\s*=/.test(t)
const hasMain = (t: string) => /"main"\s*:/.test(t) || /^\s*main\s*=/m.test(t)
const hasObservability = (t: string) =>
  /"observability"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/.test(t) || /\[observability\][\s\S]*?enabled\s*=\s*true/.test(t)

// Reference-doc pointers cited on findings (mirrors audit.ts).
const STD = 'references/cloudflare-hosting-standard.md'
const RUBRIC = 'references/audit-rubric.md'

type Cfg = { rel: string; text: string }

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')

// Collect-then-emit harness (mirrors audit.ts / ki-authoring conform.ts). Each action
// records a finding; `say` prints the human line only when not in --json mode, so a direct
// run streams prose while the aggregate consumes the wrapper. area is the rubric code, ref
// its reference-doc pointer, file the path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })
const say = (line: string): void => {
  if (!json) console.log(line)
}

function emitJson(target: string): void {
  if (!json) return
  const n = (l: Level): number => findings.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    na: n('NA'),
    pass: n('PASS')
  }
  process.stdout.write(JSON.stringify({ concern: 'website-cloudflare', target, generatedAt: new Date().toISOString(), summary, findings }))
}

async function tryRead(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

// ── collect wrangler configs: repo root + one level of subdirs (copied from audit.ts) ──
async function collectConfigs(target: string): Promise<Cfg[]> {
  const configs: Cfg[] = []
  const collectFrom = async (subdir: string) => {
    for (const n of WRANGLER_NAMES) {
      const rel = subdir ? join(subdir, n) : n
      const text = await tryRead(join(target, rel))
      if (text !== null) configs.push({ rel, text })
    }
  }
  await collectFrom('')
  let dirents: import('node:fs').Dirent[] = []
  try {
    dirents = await readdir(target, { withFileTypes: true })
  } catch {
    dirents = []
  }
  for (const e of dirents) {
    if (!e.isDirectory() || SKIP_DIRS.includes(e.name)) continue
    await collectFrom(e.name)
  }
  return configs
}

// Insert the canonical observability field before the outermost closing brace.
// Returns the new text, or null if it could not be placed safely.
function addObservability(text: string): string | null {
  if (hasObservability(text)) return null
  const lastBrace = text.lastIndexOf('}')
  if (lastBrace === -1) return null
  const head = text.slice(0, lastBrace).replace(/\s*$/, '')
  const tail = text.slice(lastBrace)
  if (!head) return null
  const needComma = !head.endsWith('{') && !head.endsWith(',')
  const insertion = `${needComma ? ',' : ''}\n  // Persist Workers logs in the dashboard (Workers & Pages → <name> → Logs).\n  "observability": { "enabled": true }\n`
  return head + insertion + tail
}

// ── entry ──
async function main() {
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  try {
    await stat(target)
  } catch {
    console.error(paint(C.red, `target path not found: ${target}`))
    process.exit(1)
    return
  }

  const configs = await collectConfigs(target)
  const ki = (await tryRead(join(target, '.ki-config.toml'))) ?? ''
  const kiTable = new RegExp(`^\\[${KI_SECTION}\\]`, 'm').test(ki)

  say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

  // ── not-hosted short-circuit (mirrors audit.ts) ──
  if (!configs.length && !kiTable) {
    rec('NA', 'WCF-1', 'no wrangler config and no [ki-website-cloudflare] table — repo is not Cloudflare-hosted; nothing to conform', STD)
    say(paint(C.yellow, 'no wrangler config and no [ki-website-cloudflare] table — repo is not Cloudflare-hosted; nothing to conform'))
    emitJson(target)
    process.exit(0)
    return
  }

  const siteCfgs = configs.filter((c) => hasAssets(c.text))
  const companions = configs.filter((c) => !hasAssets(c.text) && hasMain(c.text))
  const site = siteCfgs[0]

  // ── a) wrangler config: canonical observability field ──
  say(paint(C.cyan, 'wrangler config (observability)'))
  if (!site) {
    rec(
      'ADVISORY',
      'WCF-1',
      'no site wrangler config with an "assets" block; author one by hand (name, compatibility_date, assets.directory, routes)',
      STD
    )
    say(`  ${paint(C.dim, 'no site Worker config (assets block) found — see manual TODOs')}`)
  } else if (!/\.jsonc?$/.test(site.rel)) {
    if (!hasObservability(site.text)) {
      rec('ADVISORY', 'WCF-9', 'add observability.enabled = true by hand (TOML config)', STD, site.rel)
    } else {
      rec('PASS', 'WCF-9', 'observability already enabled', STD, site.rel)
    }
    say(`  ${paint(C.dim, `site config ${site.rel} is TOML — observability edit left to a human`)}`)
  } else if (hasObservability(site.text)) {
    rec('PASS', 'WCF-9', 'observability already enabled', STD, site.rel)
    say(`  ${paint(C.dim, 'observability already enabled')}`)
  } else {
    const updated = addObservability(site.text)
    if (updated === null) {
      rec('ADVISORY', 'WCF-9', 'add "observability": { "enabled": true } by hand (could not place it safely)', STD, site.rel)
      say(`  ${paint(C.yellow, 'skip')}  ${site.rel} — could not place observability field safely; see TODO`)
    } else {
      rec('POLISH', 'WCF-9', `observability.enabled = true ${dryRun ? 'would be added' : 'added'}`, STD, site.rel)
      say(`  ${paint(C.green, 'fix')}   ${site.rel} — add observability.enabled = true`)
      if (!dryRun) await writeFile(join(target, site.rel), updated)
    }
  }

  // ── b) .gitignore: dist/ + .wrangler/ ──
  say(`\n${paint(C.cyan, '.gitignore seam')}`)
  const gitignorePath = join(target, '.gitignore')
  const gitignore = (await tryRead(gitignorePath)) ?? ''
  const distIgnored = /^\s*\/?dist\/?\s*$/m.test(gitignore)
  const wranglerIgnored = /\.wrangler/.test(gitignore)
  const toAppend: string[] = []
  if (!distIgnored) toAppend.push('dist/')
  if (!wranglerIgnored) toAppend.push('.wrangler/')
  if (toAppend.length === 0) {
    rec('PASS', 'WCF-6', 'dist/ and .wrangler/ already ignored', STD, '.gitignore')
    say(`  ${paint(C.dim, 'dist/ and .wrangler/ already ignored')}`)
  } else {
    for (const entry of toAppend) {
      rec('POLISH', 'WCF-6', `${entry} ${dryRun ? 'would be appended' : 'appended'}`, STD, '.gitignore')
      say(`  ${paint(C.green, 'append')} .gitignore — ${entry}`)
    }
    if (!dryRun) {
      const base = gitignore === '' ? '' : gitignore.replace(/\n*$/, '\n')
      await writeFile(gitignorePath, `${base}${toAppend.join('\n')}\n`)
    }
  }

  // ── c) package.json: derived site deploy script ──
  say(`\n${paint(C.cyan, 'package.json deploy script')}`)
  const pkgRaw = await tryRead(join(target, 'package.json'))
  let pkg: { scripts?: Record<string, string> } | null = null
  try {
    pkg = pkgRaw ? (JSON.parse(pkgRaw) as { scripts?: Record<string, string> }) : null
  } catch {
    pkg = null
  }
  if (!pkgRaw || pkg === null) {
    rec('ADVISORY', 'WCF-13', 'no parseable package.json — add a site deploy script running `wrangler deploy` by hand', STD, 'package.json')
    say(`  ${paint(C.dim, 'no parseable package.json — deploy script left to a human')}`)
  } else {
    const scripts = pkg.scripts ?? {}
    const deployKey = scripts['ki:site:deploy'] ? 'ki:site:deploy' : scripts.deploy ? 'deploy' : ''
    const deployOk = deployKey !== '' && /wrangler\s+deploy/.test(scripts[deployKey] ?? '')
    if (deployOk) {
      rec('PASS', 'WCF-13', `deploy script already present: ${deployKey} → wrangler deploy`, STD, 'package.json')
      say(`  ${paint(C.dim, `deploy script already present: ${deployKey}`)}`)
    } else if (deployKey !== '') {
      // a key exists but does not run wrangler deploy — never silently rewrite it
      rec('ADVISORY', 'WCF-13', `script "${deployKey}" exists but does not run \`wrangler deploy\`; fix it by hand`, STD, 'package.json')
      say(`  ${paint(C.yellow, 'skip')}  "${deployKey}" present but not \`wrangler deploy\` — see TODO`)
    } else if (!site) {
      rec('ADVISORY', 'WCF-13', 'add a deploy script running `wrangler deploy` (needs a site config first)', STD, 'package.json')
      say(`  ${paint(C.dim, 'no site config to derive a deploy script from — see TODO')}`)
    } else {
      // Derive from the discovered site-config directory.
      const siteDir = dirname(site.rel)
      const flat = siteDir === '.' || siteDir === ''
      const key = flat ? 'deploy' : 'ki:site:deploy'
      const value = flat ? 'bunx wrangler deploy' : `cd ${siteDir} && bunx wrangler deploy`
      rec('POLISH', 'WCF-13', `scripts["${key}"] = "${value}" ${dryRun ? 'would be added' : 'added'}`, STD, 'package.json')
      say(`  ${paint(C.green, 'add')}    package.json scripts["${key}"] = "${value}"`)
      if (!dryRun) {
        const nextScripts = { ...scripts, [key]: value }
        const nextPkg = { ...pkg, scripts: nextScripts }
        // Preserve trailing newline convention.
        await writeFile(join(target, 'package.json'), `${JSON.stringify(nextPkg, null, 2)}\n`)
      }
    }
  }

  // ── companions: noted, never touched ──
  if (companions.length) {
    rec(
      'PASS',
      'WCF-19',
      `companion Worker(s) left untouched (route to cloudflare/wrangler): ${companions.map((c) => c.rel).join(', ')}`,
      STD
    )
    say(`\n${paint(C.cyan, 'boundaries')}`)
    say(
      `  ${paint(C.dim, `companion Worker(s) left untouched (route to cloudflare/wrangler): ${companions.map((c) => c.rel).join(', ')}`)}`
    )
  }

  // ── judgment items — never guessed, always surfaced ──
  rec(
    'ADVISORY',
    'WCF-23',
    'site-specific values (name, compatibility_date, assets.directory, custom_domain routes), a `wrangler pages deploy` migration, the ki:site:preview/clean scripts, and the [ki-website-cloudflare] opt-in table are judgment — apply them by reading',
    RUBRIC
  )
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  say(
    `  - Site-specific values audit.ts flags — name, compatibility_date, assets.directory, custom_domain routes — are judgment; set them by hand.`
  )
  say(
    '  - A `wrangler pages deploy` (§1), the ki:site:preview/clean scripts (§4), and the [ki-website-cloudflare] opt-in table are never auto-authored.'
  )

  say(
    `\n${paint(C.dim, 'mechanical layer applied — re-run `bun scripts/audit.ts` (or `ki:website-cloudflare:audit`) to confirm findings clear.')}`
  )

  emitJson(target)
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
