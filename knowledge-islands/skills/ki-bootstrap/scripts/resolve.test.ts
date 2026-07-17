#!/usr/bin/env bun
/**
 * Run-based regressions for fail-before-write bootstrap resolution. These scripts
 * are operational tooling rather than shipped `src/`, so the harness exercises
 * their real CLI boundaries directly instead of introducing a vitest project.
 */
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { declaredSkills, resolveSet, SKILLS_ROOT, SkillResolutionError, skillDir } from './resolve.ts'

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
const BOOTSTRAP = join(SCRIPTS, 'bootstrap.ts')
const AUDIT = join(SCRIPTS, 'audit.ts')

let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(config = ''): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-resolve-')))
  if (config) writeFileSync(join(dir, '.ki-config.toml'), config)
  return dir
}

function snapshot(root: string): string {
  const rows: string[] = []
  function walk(dir: string): void {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name)
      const rel = relative(root, path)
      const stat = statSync(path)
      if (stat.isDirectory()) {
        rows.push(`d:${rel}`)
        walk(path)
      } else rows.push(`f:${rel}:${readFileSync(path).toString('base64')}`)
    }
  }
  walk(root)
  return rows.join('\n')
}

const parsed = declaredSkills(`
[ki-plan] # exact with a comment
[ki-plan.checks]
description = """
[ki-multiline-missing]
"""
["ki-housekeeping".zones.local] # dotted quoted owner
["ki-bootstrap"]
# [ki-commented-out]
coverage-extra = "[ki-value-only]"
`)
check(
  'parser → exact/dotted roots are deduplicated and sorted',
  JSON.stringify(parsed) === JSON.stringify(['ki-bootstrap', 'ki-housekeeping', 'ki-plan'])
)

const valid = fixture(`
[ki-plan]
[ki-housekeeping.zones]
[ki-bootstrap]
[ki-harness]
`)
try {
  const set = resolveSet(valid, false, [])
  check('valid declarations → process skill remains resolvable', set.includes('ki-plan'))
  check('valid declarations → environment/global skill remains resolvable', set.includes('ki-housekeeping'))
  check('known implication → ki-harness closure includes ki-skills', set.includes('ki-harness') && set.includes('ki-skills'))
  check('bootstrap declaration → chain-starter stays excluded', !set.includes('ki-bootstrap'))
} finally {
  rmSync(valid, { recursive: true, force: true })
}

const unresolved = fixture(`
[ki-zeta-missing]
[ki-alpha-missing.checks]
[ki-zeta-missing.zones]
# [ki-comment-missing]
coverage-extra = "ki-value-missing"
`)
try {
  let caught: unknown
  try {
    resolveSet(unresolved, false, [])
  } catch (error) {
    caught = error
  }
  check('unknown declarations → typed resolution error', caught instanceof SkillResolutionError)
  check(
    'unknown declarations → each root appears once in sorted order',
    caught instanceof SkillResolutionError && JSON.stringify(caught.unresolved) === JSON.stringify(['ki-alpha-missing', 'ki-zeta-missing'])
  )
} finally {
  rmSync(unresolved, { recursive: true, force: true })
}

const noncanonical = fixture('[ki-NotReal]\n')
try {
  let caught: unknown
  try {
    resolveSet(noncanonical, false, [])
  } catch (error) {
    caught = error
  }
  check(
    'noncanonical ki-like header → fails loudly instead of disappearing',
    caught instanceof SkillResolutionError && caught.unresolved.includes('ki-NotReal')
  )
} finally {
  rmSync(noncanonical, { recursive: true, force: true })
}

const invalidConfig = fixture('[ki-does-not-exist]\n')
try {
  mkdirSync(join(invalidConfig, '.ki-meta'), { recursive: true })
  writeFileSync(join(invalidConfig, '.ki-meta', 'sentinel.txt'), 'keep me byte-identical\n')
  const before = snapshot(invalidConfig)
  const result = spawnSync('bun', [BOOTSTRAP, invalidConfig], { encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  check('bootstrap unknown declaration → non-zero exit', (result.status ?? 0) !== 0)
  check('bootstrap unknown declaration → names BOOT-9 and root', output.includes('BOOT-9') && output.includes('ki-does-not-exist'))
  check('bootstrap unknown declaration → target remains byte-identical', snapshot(invalidConfig) === before)
} finally {
  rmSync(invalidConfig, { recursive: true, force: true })
}

const invalidSeed = fixture()
try {
  mkdirSync(join(invalidSeed, '.ki-meta'), { recursive: true })
  writeFileSync(join(invalidSeed, '.ki-meta', 'sentinel.txt'), 'keep seed failure clean\n')
  const before = snapshot(invalidSeed)
  const result = spawnSync('bun', [BOOTSTRAP, invalidSeed, '--seed', 'ki-zeta-seed', '--seed', 'ki-alpha-seed', '--seed', 'ki-zeta-seed'], {
    encoding: 'utf8'
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  check('bootstrap invalid seed → non-zero exit', (result.status ?? 0) !== 0)
  check(
    'bootstrap invalid seeds → deduplicated and sorted',
    output.indexOf('ki-alpha-seed') < output.indexOf('ki-zeta-seed') && output.match(/ki-zeta-seed/g)?.length === 1
  )
  check('bootstrap invalid seed → target remains byte-identical', snapshot(invalidSeed) === before)
} finally {
  rmSync(invalidSeed, { recursive: true, force: true })
}

for (const seed of ['keystone/ki-repo', '../skills/keystone/ki-repo']) {
  const pathSeed = fixture()
  try {
    mkdirSync(join(pathSeed, '.ki-meta'), { recursive: true })
    writeFileSync(join(pathSeed, '.ki-meta', 'sentinel.txt'), 'reject noncanonical seed names\n')
    const before = snapshot(pathSeed)
    const result = spawnSync('bun', [BOOTSTRAP, pathSeed, '--seed', seed], { encoding: 'utf8' })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    check(`bootstrap path-shaped seed ${seed} → non-zero exit`, (result.status ?? 0) !== 0)
    check(`bootstrap path-shaped seed ${seed} → names rejected value`, output.includes(seed))
    check(`bootstrap path-shaped seed ${seed} → target remains byte-identical`, snapshot(pathSeed) === before)
  } finally {
    rmSync(pathSeed, { recursive: true, force: true })
  }
}

const seededRepo = fixture()
try {
  const result = spawnSync('bun', [BOOTSTRAP, seededRepo, '--seed', 'ki-repo'], { encoding: 'utf8' })
  const config = readFileSync(join(seededRepo, '.ki-config.toml'), 'utf8')
  const roots = declaredSkills(config)
  const selfCheck = spawnSync(join(seededRepo, '.ki-meta', 'bin', 'ki-audit'), ['--help'], { encoding: 'utf8' })
  check('seeded ki-repo → bootstrap exits cleanly', result.status === 0)
  check('seeded ki-repo → owner scaffolds both foundation roots', JSON.stringify(roots) === JSON.stringify(['ki-authoring', 'ki-repo']))
  check(
    'seeded ki-repo → same run vendors both foundations',
    existsSync(join(seededRepo, '.ki-meta', 'skills', 'ki-repo')) && existsSync(join(seededRepo, '.ki-meta', 'skills', 'ki-authoring'))
  )
  check(
    'seeded ki-repo → same run publishes regular runtime skill copies',
    lstatSync(join(seededRepo, '.claude', 'skills', 'ki-repo')).isDirectory() &&
      !lstatSync(join(seededRepo, '.claude', 'skills', 'ki-repo')).isSymbolicLink() &&
      existsSync(join(seededRepo, '.claude', 'skills', 'ki-repo', 'SKILL.md'))
  )
  check('seeded ki-repo → self-check entry point is runnable', selfCheck.status === 0 && selfCheck.stdout.includes('usage: ki-audit'))
} finally {
  rmSync(seededRepo, { recursive: true, force: true })
}

const temporaryHarness = realpathSync(mkdtempSync(join(tmpdir(), 'ki-bootstrap-temporary-source-')))
const temporaryTarget = fixture()
try {
  cpSync(SKILLS_ROOT, join(temporaryHarness, 'skills'), { recursive: true, dereference: true })
  const temporaryBootstrap = join(temporaryHarness, 'skills', 'keystone', 'ki-bootstrap', 'scripts', 'bootstrap.ts')
  const result = spawnSync('bun', [temporaryBootstrap, temporaryTarget, '--seed', 'ki-repo'], { encoding: 'utf8' })
  rmSync(temporaryHarness, { recursive: true, force: true })
  const copiedSkill = join(temporaryTarget, '.claude', 'skills', 'ki-repo', 'SKILL.md')
  check('temporary bootstrap source → publishes copied runtime skills', result.status === 0 && existsSync(copiedSkill))
  check(
    'temporary bootstrap source removal → copied runtime skill remains readable',
    !lstatSync(copiedSkill).isSymbolicLink() && readFileSync(copiedSkill, 'utf8').includes('#')
  )
} finally {
  rmSync(temporaryHarness, { recursive: true, force: true })
  rmSync(temporaryTarget, { recursive: true, force: true })
}

const partialRepoText = '# preserve this prefix\n[ki-repo]\nvisibility = "public"\n'
const partialRepo = fixture(partialRepoText)
try {
  const result = spawnSync('bun', [BOOTSTRAP, partialRepo], { encoding: 'utf8' })
  const config = readFileSync(join(partialRepo, '.ki-config.toml'), 'utf8')
  check('bare re-bootstrap → partial config exits cleanly', result.status === 0)
  check('bare re-bootstrap → existing config bytes remain the exact prefix', config.startsWith(partialRepoText))
  check(
    'bare re-bootstrap → missing authoring root is declared and vendored',
    declaredSkills(config).includes('ki-authoring') && existsSync(join(partialRepo, '.ki-meta', 'skills', 'ki-authoring'))
  )
} finally {
  rmSync(partialRepo, { recursive: true, force: true })
}

const seededDryRun = fixture()
try {
  const result = spawnSync('bun', [BOOTSTRAP, seededDryRun, '--seed', 'ki-repo', '--dry-run'], { encoding: 'utf8' })
  check('seeded ki-repo dry-run → exits cleanly', result.status === 0)
  check(
    'seeded ki-repo dry-run → writes neither config nor vendored state',
    !existsSync(join(seededDryRun, '.ki-config.toml')) && !existsSync(join(seededDryRun, '.ki-meta'))
  )
} finally {
  rmSync(seededDryRun, { recursive: true, force: true })
}

const auditInvalid = fixture('[ki-audit-missing.checks]\n')
try {
  const result = spawnSync('bun', [AUDIT, auditInvalid, '--json'], { encoding: 'utf8' })
  const report = JSON.parse(result.stdout) as { findings?: Array<{ area?: string; level?: string; msg?: string }> }
  const boot9 = report.findings?.find((finding) => finding.area === 'BOOT-9')
  check('BOOT-9 invalid declaration → structured non-zero FAIL', (result.status ?? 0) !== 0 && boot9?.level === 'FAIL')
  check('BOOT-9 invalid declaration → names dotted owner root', boot9?.msg?.includes('ki-audit-missing') === true)
} finally {
  rmSync(auditInvalid, { recursive: true, force: true })
}

type AuditReport = { findings?: Array<{ area?: string; level?: string; msg?: string }> }

const sourceBearing = fixture('[ki-authoring]\n')
try {
  const source = skillDir('ki-authoring')
  const targetSource = join(sourceBearing, 'skills', relative(SKILLS_ROOT, source))
  mkdirSync(dirname(targetSource), { recursive: true })
  cpSync(source, targetSource, { recursive: true })

  const bootstrapped = spawnSync('bun', [BOOTSTRAP, sourceBearing], { encoding: 'utf8' })
  const freshAudit = spawnSync('bun', [AUDIT, sourceBearing, '--json'], { encoding: 'utf8' })
  const freshReport = JSON.parse(freshAudit.stdout) as AuditReport
  const freshBoot11 = freshReport.findings?.find((finding) => finding.area === 'BOOT-11')
  check('BOOT-11 fresh file-kind vendors → bootstrap exits cleanly', bootstrapped.status === 0)
  check('BOOT-11 fresh file-kind vendors → explicit PASS with no drift', freshAudit.status === 0 && freshBoot11?.level === 'PASS')

  for (const mode of ['audit', 'conform']) {
    const vendored = join(sourceBearing, '.ki-meta', 'skills', 'ki-authoring', `${mode}.ts`)
    writeFileSync(vendored, `${readFileSync(vendored, 'utf8')}\n// injected BOOT-11 drift\n`)

    const driftAudit = spawnSync('bun', [AUDIT, sourceBearing, '--json'], { encoding: 'utf8' })
    const driftReport = JSON.parse(driftAudit.stdout) as AuditReport
    const driftBoot11 = driftReport.findings?.find((finding) => finding.area === 'BOOT-11')
    check(`BOOT-11 mutated ${mode}.ts → ship-blocking FAIL`, (driftAudit.status ?? 0) !== 0 && driftBoot11?.level === 'FAIL')

    const repaired = spawnSync('bun', [BOOTSTRAP, sourceBearing], { encoding: 'utf8' })
    const repairedAudit = spawnSync('bun', [AUDIT, sourceBearing, '--json'], { encoding: 'utf8' })
    const repairedReport = JSON.parse(repairedAudit.stdout) as AuditReport
    const repairedBoot11 = repairedReport.findings?.find((finding) => finding.area === 'BOOT-11')
    check(
      `BOOT-11 re-bootstrap repairs ${mode}.ts drift`,
      repaired.status === 0 && repairedAudit.status === 0 && repairedBoot11?.level === 'PASS'
    )
  }

  const canonicalAudit = join(targetSource, 'scripts', 'audit.ts')
  const canonicalAuditBytes = readFileSync(canonicalAudit)
  rmSync(canonicalAudit)
  const missingSourceAudit = spawnSync('bun', [AUDIT, sourceBearing, '--json'], { encoding: 'utf8' })
  const missingSourceReport = JSON.parse(missingSourceAudit.stdout) as AuditReport
  check(
    'BOOT-11 missing declared canonical source → ship-blocking FAIL',
    (missingSourceAudit.status ?? 0) !== 0 &&
      missingSourceReport.findings?.some((finding) => finding.area === 'BOOT-11' && finding.level === 'FAIL') === true
  )
  writeFileSync(canonicalAudit, canonicalAuditBytes)

  const vendoredAudit = join(sourceBearing, '.ki-meta', 'skills', 'ki-authoring', 'audit.ts')
  const vendoredAuditBytes = readFileSync(vendoredAudit)
  rmSync(vendoredAudit)
  symlinkSync(canonicalAudit, vendoredAudit)
  const symlinkAudit = spawnSync('bun', [AUDIT, sourceBearing, '--json'], { encoding: 'utf8' })
  const symlinkReport = JSON.parse(symlinkAudit.stdout) as AuditReport
  check(
    'BOOT-11 symlinked vendor → ship-blocking FAIL',
    (symlinkAudit.status ?? 0) !== 0 &&
      symlinkReport.findings?.some((finding) => finding.area === 'BOOT-11' && finding.level === 'FAIL') === true
  )
  rmSync(vendoredAudit)
  writeFileSync(vendoredAudit, vendoredAuditBytes)
} finally {
  rmSync(sourceBearing, { recursive: true, force: true })
}

const externalConsumer = fixture('[ki-authoring]\n')
try {
  const bootstrapped = spawnSync('bun', [BOOTSTRAP, externalConsumer], { encoding: 'utf8' })
  const audit = spawnSync('bun', [AUDIT, externalConsumer, '--json'], { encoding: 'utf8' })
  const report = JSON.parse(audit.stdout) as AuditReport
  const boot11 = report.findings?.find((finding) => finding.area === 'BOOT-11')
  check('BOOT-11 external consumer without canonical source → bootstrap exits cleanly', bootstrapped.status === 0)
  check('BOOT-11 external consumer without canonical source → explicit NA, not failure', audit.status === 0 && boot11?.level === 'NA')
} finally {
  rmSync(externalConsumer, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31mresolve.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32mresolve.test.ts: all checks passed\x1b[0m')
