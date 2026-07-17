#!/usr/bin/env bun
/** Run-based profile, linkage, projection, dependency, KB, and safe-write tests. */
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const AUDIT = join(HERE, 'audit.ts')
const CONFORM = join(HERE, 'conform.ts')
const EDUCATE = join(HERE, 'educate.ts')
const HORIZONS = ['Blocking', 'Next', 'Soon', 'Waiting for', 'Future'] as const
const HORIZON_BLURBS = {
  Blocking:
    'Actively broken, or blocking the `Next` horizon: takes priority over everything else and must clear before `Next` work proceeds. Empty means nothing is on fire.',
  Next: 'Scoped and ready to start — the immediate queue, picked up before anything in **Soon** or **Future**.',
  Soon: 'Understood and roughly scoped but not yet started — worth doing once the **Next** queue clears, ahead of anything still speculative.',
  'Waiting for':
    'Worth doing, but presently blocked on an external dependency or decision. Revisit when its named condition changes rather than treating it as dormant local work.',
  Future:
    "Speculative or not yet scoped — items marked _(candidate)_ need a scoping pass (or a decision to drop them) before they're actionable."
} as const
let failed = false

function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(): string {
  return mkdtempSync(join(tmpdir(), 'ki-project-roadmap-test-'))
}

function run(script: string, root: string, args: string[] = []): { code: number; out: string } {
  const result = spawnSync(process.execPath, [script, root, ...args], { encoding: 'utf8' })
  return { code: result.status ?? 1, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

function roadmap(title: string, items: Partial<Record<'Blocking' | 'Next' | 'Soon' | 'Waiting for' | 'Future', string[]>> = {}): string {
  const lines = [`# ${title}`, '']
  for (const horizon of HORIZONS) {
    lines.push(`## ${horizon}`, '', HORIZON_BLURBS[horizon], '')
    for (const item of items[horizon] ?? []) lines.push(`### ${item}`, '', `${item} details.`, '')
  }
  return `${lines.join('\n').trimEnd()}\n`
}

function plan(id: string, title: string, locator: string, blocks = '—', blockedBy = '—', status = 'open'): string {
  return [
    '---',
    `id: '${id}'`,
    `title: ${title}`,
    `status: ${status}`,
    `roadmap: ${locator}`,
    `blocks: ${blocks}`,
    `blocked-by: ${blockedBy}`,
    '---',
    '',
    `# ${title}`,
    '',
    '## Context',
    '',
    'Context.',
    '',
    '## Current state',
    '',
    'Current.',
    '',
    '## Steps',
    '',
    '1. Run the check.',
    '',
    '## Files touched',
    '',
    '- `ROADMAP.md`',
    '',
    '## Verify',
    '',
    'Run the audit and confirm exit zero.',
    '',
    '## Dependencies / blocks',
    '',
    'As declared.',
    ''
  ].join('\n')
}

function thematicFixture(): string {
  const root = fixture()
  for (const theme of ['hooks', 'runtime']) mkdirSync(join(root, 'docs', 'roadmap', theme, 'plans'), { recursive: true })
  writeFileSync(join(root, 'docs', 'roadmap', 'hooks', 'ROADMAP.md'), roadmap('Hooks roadmap', { Blocking: ['Harden hook linking'] }))
  writeFileSync(join(root, 'docs', 'roadmap', 'runtime', 'ROADMAP.md'), roadmap('Runtime roadmap', { Next: ['Add runtime parity'] }))
  writeFileSync(
    join(root, 'docs', 'roadmap', 'hooks', 'plans', '001-harden-hook-linking.md'),
    plan('001', 'Harden hook linking', 'hooks/harden-hook-linking', 'runtime/001')
  )
  writeFileSync(
    join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md'),
    plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
  )
  return root
}

// Simple profile: EDUCATE is dry-run safe, creates once, and AUDIT accepts it.
{
  const root = fixture()
  try {
    const dry = run(EDUCATE, root, ['--dry-run'])
    check('simple EDUCATE dry-run exits zero', dry.code === 0)
    check('simple EDUCATE dry-run writes nothing', !existsSync(join(root, 'ROADMAP.md')))
    const created = run(EDUCATE, root)
    check('simple EDUCATE creates ROADMAP.md', created.code === 0 && existsSync(join(root, 'ROADMAP.md')))
    const before = readFileSync(join(root, 'ROADMAP.md'), 'utf8')
    check(
      'simple EDUCATE includes every horizon blurb',
      HORIZONS.every((horizon) => before.includes(HORIZON_BLURBS[horizon]))
    )
    check('simple EDUCATE needs no empty-horizon placeholder', !before.includes('Nothing queued.'))
    check('simple AUDIT passes', run(AUDIT, root).code === 0)
    run(EDUCATE, root)
    check('simple EDUCATE never clobbers existing roadmap', readFileSync(join(root, 'ROADMAP.md'), 'utf8') === before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Simple CONFORM repairs missing blurbs without discarding existing prose and is dry-run safe and idempotent.
{
  const root = fixture()
  try {
    const custom = 'Keep this authored horizon context.'
    const original = roadmap('Roadmap', { Next: ['Ship the feature'] }).replace(HORIZON_BLURBS.Next, custom)
    writeFileSync(join(root, 'ROADMAP.md'), original)
    const invalid = run(AUDIT, root)
    check('missing simple-profile blurb fails ROAD-4', invalid.code !== 0 && invalid.out.includes('ROAD-4'))
    const dry = run(CONFORM, root, ['--dry-run'])
    check('simple CONFORM dry-run exits zero', dry.code === 0)
    check('simple CONFORM dry-run preserves bytes', readFileSync(join(root, 'ROADMAP.md'), 'utf8') === original)
    const conformed = run(CONFORM, root)
    const repaired = readFileSync(join(root, 'ROADMAP.md'), 'utf8')
    check('simple CONFORM inserts the canonical blurb', conformed.code === 0 && repaired.includes(HORIZON_BLURBS.Next))
    check('simple CONFORM preserves authored context', repaired.includes(custom))
    check('repaired simple profile audits cleanly', run(AUDIT, root).code === 0)
    run(CONFORM, root)
    check('simple CONFORM is idempotent', readFileSync(join(root, 'ROADMAP.md'), 'utf8') === repaired)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Horizon structure is exact and ordered.
{
  const root = fixture()
  try {
    writeFileSync(join(root, 'ROADMAP.md'), '# Roadmap\n\n## Next\n\n## Blocking\n')
    const result = run(AUDIT, root)
    check('malformed horizons fail', result.code !== 0 && result.out.includes('ROAD-1'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// KB off-ramp: no artifact is NA; project artifacts fail; EDUCATE never writes.
{
  const root = fixture()
  try {
    writeFileSync(join(root, '.ki-config.toml'), '["ki-repo"]\nrepo_type = "kb"\n')
    const clean = run(AUDIT, root)
    check('KB without project artifacts reports off-ramp', clean.code === 0 && clean.out.includes('ki-kb-streams'))
    run(EDUCATE, root)
    check('KB EDUCATE writes nothing', !existsSync(join(root, 'ROADMAP.md')))
    writeFileSync(join(root, 'ROADMAP.md'), roadmap('Wrong KB roadmap'))
    const invalid = run(AUDIT, root)
    check('KB project artifact fails scope', invalid.code !== 0 && invalid.out.includes('SCOPE-1'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Thematic generation, theme-local ids, qualified references, and exact drift checks.
{
  const root = thematicFixture()
  try {
    mkdirSync(join(root, 'docs', 'roadmap', 'docs'), { recursive: true })
    writeFileSync(
      join(root, 'docs', 'roadmap', 'docs', 'ROADMAP.md'),
      roadmap('Docs roadmap', { Soon: ['Allow `printWidth` via `.ki-config.toml`'] })
    )
    const dry = run(CONFORM, root, ['--dry-run'])
    check('thematic CONFORM dry-run exits zero', dry.code === 0)
    check(
      'thematic CONFORM dry-run writes no projections',
      !existsSync(join(root, 'ROADMAP.md')) && !existsSync(join(root, 'docs', 'roadmap', 'README.md'))
    )
    const conformed = run(CONFORM, root)
    check(
      'thematic CONFORM generates both projections',
      conformed.code === 0 && existsSync(join(root, 'ROADMAP.md')) && existsSync(join(root, 'docs', 'roadmap', 'README.md'))
    )
    const audited = run(AUDIT, root)
    check('valid thematic profile audits cleanly', audited.code === 0 && !/FAIL \(/.test(audited.out))
    check('theme-local plan ids may repeat across themes', audited.code === 0)
    check('theme without active plans needs no plans directory', !existsSync(join(root, 'docs', 'roadmap', 'docs', 'plans')))
    check(
      'root is a compact linked projection',
      readFileSync(join(root, 'ROADMAP.md'), 'utf8').includes('hooks/ROADMAP.md#harden-hook-linking')
    )
    check(
      'root projection includes every horizon blurb',
      HORIZONS.every((horizon) => readFileSync(join(root, 'ROADMAP.md'), 'utf8').includes(HORIZON_BLURBS[horizon]))
    )
    check('root projection needs no empty-horizon placeholder', !readFileSync(join(root, 'ROADMAP.md'), 'utf8').includes('Nothing queued.'))
    check(
      'root links use rendered Markdown heading anchors',
      readFileSync(join(root, 'ROADMAP.md'), 'utf8').includes('docs/ROADMAP.md#allow-printwidth-via-ki-configtoml')
    )
    const index = readFileSync(join(root, 'docs', 'roadmap', 'README.md'), 'utf8')
    check('global index renders qualified plan references', index.includes('[hooks/001](') && index.includes('[runtime/001]('))
    check('global index renders qualified dependency edge', index.includes('hooks/001 ──► runtime/001'))
    writeFileSync(join(root, 'ROADMAP.md'), '# drift\n')
    const drift = run(AUDIT, root)
    check('projection drift fails exactly', drift.code !== 0 && drift.out.includes('PROJ-1'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Thematic CONFORM repairs canonical theme roadmaps and preserves existing prose.
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'ROADMAP.md')
    const custom = 'Keep this theme-specific horizon context.'
    const original = readFileSync(path, 'utf8').replace(HORIZON_BLURBS.Next, custom)
    writeFileSync(path, original)
    const dry = run(CONFORM, root, ['--dry-run'])
    check('thematic blurb repair dry-run exits zero', dry.code === 0)
    check('thematic blurb repair dry-run preserves bytes', readFileSync(path, 'utf8') === original)
    const conformed = run(CONFORM, root)
    const repaired = readFileSync(path, 'utf8')
    check('thematic CONFORM inserts the canonical blurb', conformed.code === 0 && repaired.includes(HORIZON_BLURBS.Next))
    check('thematic CONFORM preserves authored context', repaired.includes(custom))
    check('repaired thematic profile audits cleanly', run(AUDIT, root).code === 0)
    run(CONFORM, root)
    check('thematic CONFORM is idempotent', readFileSync(path, 'utf8') === repaired)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// An empty active-plan index uses a readable sentence rather than a placeholder table.
{
  const root = fixture()
  try {
    mkdirSync(join(root, 'docs', 'roadmap', 'hooks'), { recursive: true })
    writeFileSync(join(root, 'docs', 'roadmap', 'hooks', 'ROADMAP.md'), roadmap('Hooks roadmap'))
    const conformed = run(CONFORM, root)
    const generated = readFileSync(join(root, 'docs', 'roadmap', 'README.md'), 'utf8')
    check('zero-plan index conforms cleanly', conformed.code === 0 && run(AUDIT, root).code === 0)
    check(
      'zero-plan index avoids a placeholder table',
      generated.includes('## Active plans\n\nNo active plans.\n\n## Dependency graph') && !generated.includes('| Plan |')
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Long plan metadata remains readable because each plan is rendered as a subsection.
{
  const root = thematicFixture()
  try {
    const theme = 'project-roadmap'
    const title = 'Require canonical horizon blurbs and restore them during CONFORM'
    const themeRoot = join(root, 'docs', 'roadmap', theme)
    mkdirSync(join(themeRoot, 'plans'), { recursive: true })
    writeFileSync(join(themeRoot, 'ROADMAP.md'), roadmap('Project roadmap roadmap', { Next: [title] }))
    writeFileSync(
      join(themeRoot, 'plans', '001-canonical-horizon-blurbs.md'),
      plan('001', title, 'project-roadmap/require-canonical-horizon-blurbs-and-restore-them-during-conform')
    )
    const conformed = run(CONFORM, root)
    const generated = readFileSync(join(root, 'docs', 'roadmap', 'README.md'), 'utf8')
    check('wide active-plan index conforms cleanly', conformed.code === 0 && run(AUDIT, root).code === 0)
    check(
      'wide active-plan index uses a linked heading and metadata list',
      generated.includes('### [project-roadmap/001](project-roadmap/plans/001-canonical-horizon-blurbs.md)') &&
        generated.includes(`- **Title:** ${title}`) &&
        generated.includes('- **Theme:** `project-roadmap`') &&
        generated.includes('- **Roadmap item:** `project-roadmap/require-canonical-horizon-blurbs-and-restore-them-during-conform`') &&
        !generated.includes('| Plan |')
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Invalid locator and non-near horizon are mechanical failures.
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    writeFileSync(path, plan('001', 'Add runtime parity', 'hooks/missing-item', '—', 'hooks/001'))
    const result = run(AUDIT, root)
    check('unresolved cross-theme locator fails', result.code !== 0 && result.out.includes('PLAN-2'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    writeFileSync(join(root, 'docs', 'roadmap', 'runtime', 'ROADMAP.md'), roadmap('Runtime roadmap', { Soon: ['Add runtime parity'] }))
    const result = run(AUDIT, root)
    check('plan linked outside Blocking/Next fails', result.code !== 0 && result.out.includes('plans exist only in Blocking or Next'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Qualified plan references collide only within a theme; dependency cycles remain invalid.
{
  const root = thematicFixture()
  try {
    const hooksRoadmap = join(root, 'docs', 'roadmap', 'hooks', 'ROADMAP.md')
    writeFileSync(hooksRoadmap, roadmap('Hooks roadmap', { Blocking: ['Harden hook linking', 'Audit hook installation'] }))
    writeFileSync(
      join(root, 'docs', 'roadmap', 'hooks', 'plans', '001-audit-hook-installation.md'),
      plan('001', 'Audit hook installation', 'hooks/audit-hook-installation')
    )
    const duplicate = run(AUDIT, root)
    check('duplicate qualified plan reference fails within a theme', duplicate.code !== 0 && duplicate.out.includes('hooks/001'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const hooks = join(root, 'docs', 'roadmap', 'hooks', 'plans', '001-harden-hook-linking.md')
    const runtime = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    writeFileSync(hooks, plan('001', 'Harden hook linking', 'hooks/harden-hook-linking', 'runtime/001', 'runtime/001'))
    writeFileSync(runtime, plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', 'hooks/001', 'hooks/001'))
    const cycle = run(AUDIT, root)
    check('dependency cycle fails', cycle.code !== 0 && cycle.out.includes('dependency cycle'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Plan frontmatter, dependency fields, and body structure fail closed.
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    writeFileSync(path, original.replace("id: '001'", 'id: 001').concat("\nid: '001'\n"))
    const result = run(AUDIT, root)
    check('quoted id must occur in frontmatter, not the body', result.code !== 0 && result.out.includes('id must be quoted in frontmatter'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    writeFileSync(path, original.replace('title: Add runtime parity', 'title: Add runtime parity\ntitle: Duplicate title'))
    const result = run(AUDIT, root)
    check('duplicate frontmatter keys fail', result.code !== 0 && result.out.includes("duplicate frontmatter key 'title'"))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    writeFileSync(path, original.replace('status: open', 'status: open\nowner: nobody'))
    const result = run(AUDIT, root)
    check('unexpected frontmatter keys fail', result.code !== 0 && result.out.includes('frontmatter has unexpected field(s): owner'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
for (const field of ['id', 'title', 'status', 'roadmap']) {
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    writeFileSync(path, original.replace(new RegExp(`^${field}:.*$`, 'm'), `${field}:`))
    const result = run(AUDIT, root)
    check(`empty ${field} fails`, result.code !== 0 && result.out.includes(`frontmatter field '${field}' must not be empty`))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    writeFileSync(path, plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '001', 'hooks/001'))
    const result = run(AUDIT, root)
    check(
      'bare dependency ids fail',
      result.code !== 0 && result.out.includes("dependency '001' is not a qualified <theme>/<NNN> plan reference")
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    writeFileSync(path, plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', 'runtime/001, runtime/001', 'hooks/001'))
    const result = run(AUDIT, root)
    check(
      'duplicate qualified dependency references fail',
      result.code !== 0 && result.out.includes('blocks contains duplicate id(s): runtime/001')
    )
    check('qualified self dependencies fail', result.code !== 0 && result.out.includes('plan runtime/001 must not depend on itself'))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    writeFileSync(path, plan('001', 'Add runtime parity', 'runtime/add-runtime-parity'))
    const result = run(AUDIT, root)
    check(
      'qualified dependency reciprocity is required',
      result.code !== 0 && result.out.includes('blocks runtime/001, but its blocked-by omits hooks/001')
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    writeFileSync(path, original.replace('## Current state', '## Verify first'))
    const result = run(AUDIT, root)
    check(
      'plan body requires the exact ordered core H2 sections',
      result.code !== 0 && result.out.includes('body must contain each core H2 exactly once')
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
for (const section of ['Steps', 'Verify']) {
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const original = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
    const next = section === 'Steps' ? 'Files touched' : 'Dependencies / blocks'
    writeFileSync(path, original.replace(new RegExp(`(## ${section})[\\s\\S]*?(?=## ${next})`), `$1\n\n`))
    const result = run(AUDIT, root)
    check(`plan body rejects empty ${section}`, result.code !== 0 && result.out.includes(`body section '${section}' must not be empty`))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'docs', 'roadmap', 'runtime', 'plans', '001-add-runtime-parity.md')
    const composed = plan('001', 'Add runtime parity', 'runtime/add-runtime-parity', '—', 'hooks/001')
      .replace('blocked-by: hooks/001', 'blocked-by: hooks/001\nhandoff: true\ntier: sonnet\nreadiness: pending')
      .concat('\n## Decisions\n\nLocked: use the thematic layout.\n\nEscalate: none.\n')
    writeFileSync(path, composed)
    run(CONFORM, root)
    check('composed handoff fields and extension sections remain valid', run(AUDIT, root).code === 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

// Generated outputs never follow symlinks.
{
  const root = thematicFixture()
  const outside = fixture()
  try {
    const sentinel = join(outside, 'sentinel.md')
    writeFileSync(sentinel, 'do not replace\n')
    symlinkSync(sentinel, join(root, 'ROADMAP.md'))
    const result = run(CONFORM, root)
    check('CONFORM refuses symlink output', result.code !== 0 && result.out.includes('SAFE-1'))
    check('CONFORM leaves symlink target byte-identical', readFileSync(sentinel, 'utf8') === 'do not replace\n')
  } finally {
    rmSync(root, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
}

// Dangling generated-output symlinks are entries and must never be replaced.
{
  const root = fixture()
  try {
    const path = join(root, 'ROADMAP.md')
    symlinkSync(join(root, 'missing-roadmap'), path)
    const result = run(EDUCATE, root)
    check('EDUCATE refuses a dangling ROADMAP symlink', result.code !== 0 && result.out.includes('SAFE-1'))
    check('EDUCATE leaves a dangling ROADMAP symlink in place', lstatSync(path).isSymbolicLink())
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const path = join(root, 'ROADMAP.md')
    symlinkSync(join(root, 'missing-roadmap'), path)
    const result = run(CONFORM, root)
    check('CONFORM refuses a dangling root projection symlink', result.code !== 0 && result.out.includes('SAFE-1'))
    check('CONFORM leaves a dangling root projection symlink in place', lstatSync(path).isSymbolicLink())
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}
{
  const root = thematicFixture()
  try {
    const initial = run(CONFORM, root)
    const path = join(root, 'docs', 'roadmap', 'README.md')
    rmSync(path)
    symlinkSync(join(root, 'missing-index'), path)
    const result = run(CONFORM, root)
    check('CONFORM dangling-index fixture starts canonical', initial.code === 0)
    check('CONFORM refuses a dangling generated-index symlink', result.code !== 0 && result.out.includes('SAFE-1'))
    check('CONFORM leaves a dangling generated-index symlink in place', lstatSync(path).isSymbolicLink())
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

if (failed) {
  console.log('\n\x1b[31mproject-roadmap.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32mproject-roadmap.test.ts: all checks passed\x1b[0m')
