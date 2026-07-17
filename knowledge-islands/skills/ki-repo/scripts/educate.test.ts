#!/usr/bin/env bun
/**
 * Run-based behavioural tests for ki-repo's `.ki-config.toml` scaffolding.
 *
 * The scripts are CLI-shaped operational tooling, so this exercises their real
 * subprocess entrypoints against throwaway repos instead of importing internals.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
const AUDIT = join(SCRIPTS, 'audit.ts')
const CONFORM = join(SCRIPTS, 'conform.ts')
const EDUCATE = join(SCRIPTS, 'educate.ts')
const MKFIFO = ['/usr/bin/mkfifo', '/bin/mkfifo'].find((path) => existsSync(path))

let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(initial: string | null): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ki-repo-educate-test-')))
  if (initial !== null) writeFileSync(join(dir, '.ki-config.toml'), initial)
  return dir
}

function run(script: string, args: string[], env: NodeJS.ProcessEnv = process.env): { code: number; out: string } {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env })
  return { code: result.status ?? 1, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

function runInit(dir: string, dryRun = false): { code: number; out: string } {
  return run(EDUCATE, [dir, '--scaffold-config-only', ...(dryRun ? ['--dry-run'] : [])])
}

function runInitWithEnv(dir: string, env: Record<string, string>): { code: number; out: string } {
  return runInitEnv(dir, { ...process.env, NODE_ENV: 'test', ...env })
}

function runInitEnv(dir: string, env: NodeJS.ProcessEnv): { code: number; out: string } {
  return run(EDUCATE, [dir, '--scaffold-config-only'], env)
}

function transactionArtifacts(dir: string): string[] {
  return readdirSync(dir).filter((name) => name.startsWith('.ki-repo-transaction-'))
}

function rootCount(text: string, table: string): number {
  return text.split(/\r?\n/).filter((raw) => raw.replace(/#.*$/, '').trim() === `[${table}]`).length
}

function fakeGh(dir: string): NodeJS.ProcessEnv {
  const bin = join(dir, 'fake-bin')
  mkdirSync(bin)
  const gh = join(bin, 'gh')
  writeFileSync(
    gh,
    `#!/bin/sh
case "$*" in
  "api repos/acme/config-test/branches/main/protection") exit 1 ;;
  "api repos/acme/config-test/automated-security-fixes") echo '{"enabled":true}' ;;
  "api repos/acme/config-test/actions/permissions") echo '{"enabled":true,"allowed_actions":"all"}' ;;
  "api repos/acme/config-test/vulnerability-alerts") exit 0 ;;
  "api repos/acme/config-test") echo '{"private":true,"has_wiki":false,"has_projects":false,"has_issues":true,"allow_merge_commit":false,"allow_rebase_merge":false,"allow_squash_merge":true,"delete_branch_on_merge":true,"allow_update_branch":true}' ;;
  *) exit 0 ;;
esac
`
  )
  chmodSync(gh, 0o755)
  return { ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}` }
}

function prepareConformFixture(initial: string | null): { dir: string; env: NodeJS.ProcessEnv } {
  const dir = fixture(initial)
  execFileSync('git', ['init', '-q', dir])
  execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', 'git@github.com:acme/config-test.git'])
  return { dir, env: fakeGh(dir) }
}

const templateRun = run(AUDIT, ['--educate'])
const template = templateRun.out
check('audit --educate exits cleanly', templateRun.code === 0)

// Missing file: the owner emits the complete canonical template.
const missing = fixture(null)
try {
  const result = runInit(missing)
  const actual = readFileSync(join(missing, '.ki-config.toml'), 'utf8')
  check('EDUCATE missing file exits cleanly', result.code === 0)
  check('EDUCATE missing file matches audit --educate byte-for-byte', actual === template)
  check('canonical template has exactly one [ki-repo] root', rootCount(actual, 'ki-repo') === 1)
  check('canonical template has exactly one [ki-authoring] root', rootCount(actual, 'ki-authoring') === 1)
} finally {
  rmSync(missing, { recursive: true, force: true })
}

// Both partial directions preserve the existing file byte-for-byte as a prefix.
const authoringOnlyText = '# keep this comment and ordering\r\n[ki-authoring]\r\ncustom = "untouched"'
const authoringOnly = fixture(authoringOnlyText)
try {
  const result = runInit(authoringOnly)
  const actual = readFileSync(join(authoringOnly, '.ki-config.toml'), 'utf8')
  check('EDUCATE authoring-only exits cleanly', result.code === 0)
  check('EDUCATE authoring-only preserves every existing byte as prefix', actual.startsWith(authoringOnlyText))
  check('EDUCATE authoring-only appends one repo root', rootCount(actual, 'ki-repo') === 1)
  check('EDUCATE authoring-only does not duplicate authoring root', rootCount(actual, 'ki-authoring') === 1)
} finally {
  rmSync(authoringOnly, { recursive: true, force: true })
}

const repoOnlyText = '# keep repo values\n[ki-repo]\nvisibility = "public"\nlicense = "Apache-2.0"\n'
const repoOnly = fixture(repoOnlyText)
try {
  const result = runInit(repoOnly)
  const actual = readFileSync(join(repoOnly, '.ki-config.toml'), 'utf8')
  check('EDUCATE repo-only exits cleanly', result.code === 0)
  check('EDUCATE repo-only preserves every existing byte as prefix', actual.startsWith(repoOnlyText))
  check('EDUCATE repo-only does not duplicate repo root', rootCount(actual, 'ki-repo') === 1)
  check('EDUCATE repo-only appends one authoring root', rootCount(actual, 'ki-authoring') === 1)
} finally {
  rmSync(repoOnly, { recursive: true, force: true })
}

// A dotted subtable is not the required parent marker, and a second run is inert.
const subtableText = '# subtable is not the root\n[ki-repo.checks]\nwiki = false'
const subtable = fixture(subtableText)
try {
  const first = runInit(subtable)
  const afterFirst = readFileSync(join(subtable, '.ki-config.toml'), 'utf8')
  const second = runInit(subtable)
  const afterSecond = readFileSync(join(subtable, '.ki-config.toml'), 'utf8')
  check('EDUCATE subtable-only exits cleanly', first.code === 0)
  check('EDUCATE subtable-only preserves every existing byte as prefix', afterFirst.startsWith(subtableText))
  check('EDUCATE subtable-only appends the exact repo root', rootCount(afterFirst, 'ki-repo') === 1)
  check('EDUCATE is idempotent', second.code === 0 && afterSecond === afterFirst)
} finally {
  rmSync(subtable, { recursive: true, force: true })
}

const multilineLookalikes = `[ki-repo.checks]
note = """
[ki-repo]
[ki-authoring]
"""
`
const multiline = fixture(multilineLookalikes)
try {
  const first = runInit(multiline)
  const afterFirst = readFileSync(join(multiline, '.ki-config.toml'), 'utf8')
  const second = runInit(multiline)
  const afterSecond = readFileSync(join(multiline, '.ki-config.toml'), 'utf8')
  check('EDUCATE multiline lookalikes → exits cleanly', first.code === 0)
  check('EDUCATE multiline lookalikes → preserves the string bytes as prefix', afterFirst.startsWith(multilineLookalikes))
  check(
    'EDUCATE multiline lookalikes → appends real roots after the string closes',
    afterFirst.lastIndexOf('[ki-repo]') > afterFirst.lastIndexOf('"""')
  )
  check('EDUCATE multiline lookalikes → second run is byte-identical', second.code === 0 && afterSecond === afterFirst)
} finally {
  rmSync(multiline, { recursive: true, force: true })
}

const quotedRootsText = '["ki-repo"]\nvisibility = "private"\n["ki-authoring"]\n'
const quotedRoots = fixture(quotedRootsText)
try {
  const result = runInit(quotedRoots)
  check('EDUCATE quoted exact roots → exits cleanly', result.code === 0)
  check(
    'EDUCATE quoted exact roots → recognised without a rewrite',
    readFileSync(join(quotedRoots, '.ki-config.toml'), 'utf8') === quotedRootsText
  )
} finally {
  rmSync(quotedRoots, { recursive: true, force: true })
}

const dry = fixture(null)
try {
  const result = runInit(dry, true)
  check('EDUCATE dry-run exits cleanly', result.code === 0)
  check('EDUCATE dry-run reports both missing roots', result.out.includes('[ki-repo]') && result.out.includes('[ki-authoring]'))
  check('EDUCATE dry-run does not write config', !existsSync(join(dry, '.ki-config.toml')))
} finally {
  rmSync(dry, { recursive: true, force: true })
}

// EDUCATE publication refuses symlink leaves, including dangling symlinks, without
// touching their targets or leaving transaction files behind.
const symlinkLeaf = fixture(null)
const symlinkOutside = fixture('# outside config\n')
try {
  const outsideConfig = join(symlinkOutside, '.ki-config.toml')
  symlinkSync(outsideConfig, join(symlinkLeaf, '.ki-config.toml'))
  const result = runInit(symlinkLeaf)
  check('EDUCATE symlink config leaf → refuses', result.code !== 0)
  check('EDUCATE symlink config leaf → preserves outside bytes', readFileSync(outsideConfig, 'utf8') === '# outside config\n')
  check('EDUCATE symlink config leaf → remains a symlink', lstatSync(join(symlinkLeaf, '.ki-config.toml')).isSymbolicLink())
  check('EDUCATE symlink config leaf → no transaction artifacts', transactionArtifacts(symlinkLeaf).length === 0)
} finally {
  rmSync(symlinkLeaf, { recursive: true, force: true })
  rmSync(symlinkOutside, { recursive: true, force: true })
}

const danglingLeaf = fixture(null)
try {
  symlinkSync(join(danglingLeaf, 'missing-target'), join(danglingLeaf, '.ki-config.toml'))
  const result = runInit(danglingLeaf)
  check('EDUCATE dangling config leaf → refuses', result.code !== 0)
  check('EDUCATE dangling config leaf → remains a symlink', lstatSync(join(danglingLeaf, '.ki-config.toml')).isSymbolicLink())
  check('EDUCATE dangling config leaf → no transaction artifacts', transactionArtifacts(danglingLeaf).length === 0)
} finally {
  rmSync(danglingLeaf, { recursive: true, force: true })
}

const directoryLeaf = fixture(null)
try {
  mkdirSync(join(directoryLeaf, '.ki-config.toml'))
  const result = runInit(directoryLeaf)
  check('EDUCATE directory config leaf → refuses', result.code !== 0)
  check('EDUCATE directory config leaf → preserves directory', lstatSync(join(directoryLeaf, '.ki-config.toml')).isDirectory())
  check('EDUCATE directory config leaf → no transaction artifacts', transactionArtifacts(directoryLeaf).length === 0)
} finally {
  rmSync(directoryLeaf, { recursive: true, force: true })
}

const specialLeaf = fixture(null)
try {
  if (!MKFIFO) check('EDUCATE special config leaf → skipped: mkfifo unavailable', true)
  else {
    execFileSync(MKFIFO, [join(specialLeaf, '.ki-config.toml')])
    const result = runInit(specialLeaf)
    check('EDUCATE special config leaf → refuses', result.code !== 0)
    check('EDUCATE special config leaf → preserves special file', lstatSync(join(specialLeaf, '.ki-config.toml')).isFIFO())
    check('EDUCATE special config leaf → no transaction artifacts', transactionArtifacts(specialLeaf).length === 0)
  }
} finally {
  rmSync(specialLeaf, { recursive: true, force: true })
}

// Snapshot/publication races fail closed. A content mutation and a same-byte
// replacement are both preserved rather than overwritten.
const contentRace = fixture(authoringOnlyText)
try {
  const result = runInitWithEnv(contentRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_MUTATE_BEFORE_PUBLISH: '# concurrent config\n'
  })
  check('EDUCATE config content race → refuses', result.code !== 0)
  check(
    'EDUCATE config content race → preserves concurrent bytes',
    readFileSync(join(contentRace, '.ki-config.toml'), 'utf8') === '# concurrent config\n'
  )
  check('EDUCATE config content race → no transaction artifacts', transactionArtifacts(contentRace).length === 0)
} finally {
  rmSync(contentRace, { recursive: true, force: true })
}

const sameByteRace = fixture(authoringOnlyText)
try {
  const config = join(sameByteRace, '.ki-config.toml')
  const originalInode = lstatSync(config).ino
  const result = runInitWithEnv(sameByteRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_REPLACE_SAME_BYTES_BEFORE_PUBLISH: '1'
  })
  check('EDUCATE same-byte/new-inode race → refuses', result.code !== 0)
  check('EDUCATE same-byte/new-inode race → preserves replacement bytes', readFileSync(config, 'utf8') === authoringOnlyText)
  check('EDUCATE same-byte/new-inode race → detects the new inode', lstatSync(config).ino !== originalInode)
  check('EDUCATE same-byte/new-inode race → preserves displaced original', lstatSync(`${config}.ki-test-original`).ino === originalInode)
  check('EDUCATE same-byte/new-inode race → no transaction artifacts', transactionArtifacts(sameByteRace).length === 0)
} finally {
  rmSync(sameByteRace, { recursive: true, force: true })
}

// A failure after publication restores an authored leaf's exact bytes and mode;
// a newly created leaf returns to absence.
const exactRollback = fixture(authoringOnlyText)
try {
  const config = join(exactRollback, '.ki-config.toml')
  chmodSync(config, 0o600)
  const inode = lstatSync(config).ino
  const result = runInitWithEnv(exactRollback, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_FAIL_AFTER_PUBLISH: '1'
  })
  check('EDUCATE post-publication failure → refuses', result.code !== 0)
  check('EDUCATE post-publication failure → restores exact bytes', readFileSync(config, 'utf8') === authoringOnlyText)
  check('EDUCATE post-publication failure → restores exact mode', (lstatSync(config).mode & 0o7777) === 0o600)
  check('EDUCATE post-publication failure → restores exact inode', lstatSync(config).ino === inode)
  check('EDUCATE post-publication failure → no transaction artifacts', transactionArtifacts(exactRollback).length === 0)
} finally {
  rmSync(exactRollback, { recursive: true, force: true })
}

const absentRollback = fixture(null)
try {
  const result = runInitWithEnv(absentRollback, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_FAIL_AFTER_PUBLISH: '1'
  })
  check('EDUCATE absent config rollback → refuses', result.code !== 0)
  check('EDUCATE absent config rollback → restores absence', !existsSync(join(absentRollback, '.ki-config.toml')))
  check('EDUCATE absent config rollback → no transaction artifacts', transactionArtifacts(absentRollback).length === 0)
} finally {
  rmSync(absentRollback, { recursive: true, force: true })
}

// A writer can recreate the destination after rollback validates absence. The
// exclusive restoration must preserve that replacement and the exact authored
// inode in private quarantine rather than renaming over either one.
const rollbackPublicationRace = fixture(authoringOnlyText)
try {
  const config = join(rollbackPublicationRace, '.ki-config.toml')
  const originalInode = lstatSync(config).ino
  const result = runInitWithEnv(rollbackPublicationRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_FAIL_AFTER_PUBLISH: '1',
    KI_REPO_TEST_RECREATE_BEFORE_ROLLBACK: '# rollback replacement\n'
  })
  const transactions = transactionArtifacts(rollbackPublicationRace)
  check('EDUCATE rollback publication race → refuses', result.code !== 0)
  check(
    'EDUCATE rollback publication race → replacement survives',
    readFileSync(config, 'utf8') === '# rollback replacement\n' && lstatSync(config).ino !== originalInode
  )
  check('EDUCATE rollback publication race → preserves one private transaction', transactions.length === 1)
  if (transactions.length === 1) {
    const transaction = join(rollbackPublicationRace, transactions[0])
    const quarantines = readdirSync(transaction).filter((name) => name.endsWith('.original'))
    check(
      'EDUCATE rollback publication race → exact authored inode remains quarantined',
      quarantines.length === 1 &&
        lstatSync(join(transaction, quarantines[0])).ino === originalInode &&
        readFileSync(join(transaction, quarantines[0]), 'utf8') === authoringOnlyText
    )
  }
} finally {
  rmSync(rollbackPublicationRace, { recursive: true, force: true })
}

// A same-byte/new-inode replacement after publication is still a conflict. The
// replacement remains at the destination and the authored original remains in
// private quarantine with its exact identity and bytes.
const postPublicationReplacement = fixture(authoringOnlyText)
try {
  const config = join(postPublicationReplacement, '.ki-config.toml')
  const originalInode = lstatSync(config).ino
  const result = runInitWithEnv(postPublicationReplacement, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_REPLACE_SAME_BYTES_AFTER_PUBLISH: '1'
  })
  const transactions = transactionArtifacts(postPublicationReplacement)
  const displacedPublished = `${config}.ki-test-published-after-publication`
  check('EDUCATE post-publication same-byte/new-inode replacement → refuses', result.code !== 0)
  check(
    'EDUCATE post-publication same-byte/new-inode replacement → replacement survives',
    existsSync(displacedPublished) &&
      readFileSync(config).equals(readFileSync(displacedPublished)) &&
      lstatSync(config).ino !== lstatSync(displacedPublished).ino
  )
  check('EDUCATE post-publication same-byte/new-inode replacement → preserves private transaction', transactions.length === 1)
  if (transactions.length === 1) {
    const transaction = join(postPublicationReplacement, transactions[0])
    const quarantines = readdirSync(transaction).filter((name) => name.endsWith('.original'))
    check(
      'EDUCATE post-publication same-byte/new-inode replacement → exact authored original survives',
      quarantines.length === 1 &&
        lstatSync(join(transaction, quarantines[0])).ino === originalInode &&
        readFileSync(join(transaction, quarantines[0]), 'utf8') === authoringOnlyText
    )
  }
} finally {
  rmSync(postPublicationReplacement, { recursive: true, force: true })
}

// Creation-time modes must not be confused with inode identity. A restrictive
// umask is corrected by fchmod for both a new canonical file and an authored
// file whose 0664 mode must survive the append transaction.
const absentUmask = fixture(null)
try {
  const result = runInitWithEnv(absentUmask, { KI_REPO_TEST_UMASK: '077' })
  const config = join(absentUmask, '.ki-config.toml')
  check('EDUCATE umask 077 absent config → exits cleanly', result.code === 0)
  check('EDUCATE umask 077 absent config → publishes canonical 0644 mode', (lstatSync(config).mode & 0o7777) === 0o644)
  check('EDUCATE umask 077 absent config → no transaction artifacts', transactionArtifacts(absentUmask).length === 0)
} finally {
  rmSync(absentUmask, { recursive: true, force: true })
}

const opaqueCreationUmask = fixture(null)
try {
  const result = runInitWithEnv(opaqueCreationUmask, { KI_REPO_TEST_UMASK: '777' })
  const config = join(opaqueCreationUmask, '.ki-config.toml')
  check('EDUCATE umask 0777 absent config → exits cleanly', result.code === 0)
  check('EDUCATE umask 0777 absent config → transaction remains operable and publishes 0644', (lstatSync(config).mode & 0o7777) === 0o644)
  check('EDUCATE umask 0777 absent config → no transaction artifacts', transactionArtifacts(opaqueCreationUmask).length === 0)
} finally {
  rmSync(opaqueCreationUmask, { recursive: true, force: true })
}

const authoredMode = fixture(authoringOnlyText)
try {
  const config = join(authoredMode, '.ki-config.toml')
  chmodSync(config, 0o664)
  const result = runInitWithEnv(authoredMode, { KI_REPO_TEST_UMASK: '077' })
  check('EDUCATE umask 077 authored 0664 config → exits cleanly', result.code === 0)
  check('EDUCATE umask 077 authored 0664 config → preserves mode', (lstatSync(config).mode & 0o7777) === 0o664)
  check('EDUCATE umask 077 authored 0664 config → preserves authored prefix', readFileSync(config, 'utf8').startsWith(authoringOnlyText))
  check('EDUCATE umask 077 authored 0664 config → no transaction artifacts', transactionArtifacts(authoredMode).length === 0)
} finally {
  rmSync(authoredMode, { recursive: true, force: true })
}

const transactionValidationFailure = fixture(null)
try {
  const result = runInitWithEnv(transactionValidationFailure, { KI_REPO_TEST_FAIL_TRANSACTION_VALIDATION: '1' })
  check('EDUCATE transaction validation failure → refuses', result.code !== 0)
  check(
    'EDUCATE transaction validation failure → config remains absent',
    !existsSync(join(transactionValidationFailure, '.ki-config.toml'))
  )
  check(
    'EDUCATE transaction validation failure → created directory is cleaned',
    transactionArtifacts(transactionValidationFailure).length === 0
  )
} finally {
  rmSync(transactionValidationFailure, { recursive: true, force: true })
}

const postFchmodFailure = fixture(null)
try {
  const result = runInitWithEnv(postFchmodFailure, {
    KI_REPO_TEST_UMASK: '077',
    KI_REPO_TEST_FAIL_AFTER_FCHMOD_STEM: '.ki-config.toml.candidate'
  })
  check('EDUCATE post-fchmod failure → refuses', result.code !== 0)
  check('EDUCATE post-fchmod failure → config remains absent', !existsSync(join(postFchmodFailure, '.ki-config.toml')))
  check('EDUCATE post-fchmod failure → refreshed journal cleans transaction', transactionArtifacts(postFchmodFailure).length === 0)
} finally {
  rmSync(postFchmodFailure, { recursive: true, force: true })
}

const materialiseFailure = fixture(null)
try {
  const result = runInitWithEnv(materialiseFailure, {
    KI_REPO_TEST_FAIL_MATERIALISE_STEM: '.ki-config.toml.candidate'
  })
  check('EDUCATE candidate materialisation failure → refuses', result.code !== 0)
  check('EDUCATE candidate materialisation failure → config remains absent', !existsSync(join(materialiseFailure, '.ki-config.toml')))
  check(
    'EDUCATE candidate materialisation failure → immediate journal cleans private state',
    transactionArtifacts(materialiseFailure).length === 0
  )
} finally {
  rmSync(materialiseFailure, { recursive: true, force: true })
}

// An external hard-link alias can mutate the moved original inode. Rollback uses
// the separately materialised snapshot, restores the destination bytes, and keeps
// the alias mutation visible in the private quarantine instead of hiding it.
const aliasRace = fixture(authoringOnlyText)
const aliasOutside = fixture(null)
try {
  const config = join(aliasRace, '.ki-config.toml')
  const alias = join(aliasOutside, 'config-alias')
  linkSync(config, alias)
  const result = runInitWithEnv(aliasRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_MUTATE_ALIAS_AFTER_QUARANTINE: alias
  })
  const transactions = transactionArtifacts(aliasRace)
  check('EDUCATE external hard-link mutation → refuses', result.code !== 0)
  check('EDUCATE external hard-link mutation → restores snapshot bytes', readFileSync(config, 'utf8') === authoringOnlyText)
  check(
    'EDUCATE external hard-link mutation → alias mutation remains visible',
    readFileSync(alias, 'utf8') === 'external hard-link mutation\n'
  )
  check('EDUCATE external hard-link mutation → preserves one private transaction', transactions.length === 1)
  if (transactions.length === 1) {
    const transaction = join(aliasRace, transactions[0])
    check('EDUCATE external hard-link mutation → private transaction mode is 0700', (lstatSync(transaction).mode & 0o7777) === 0o700)
    const quarantines = readdirSync(transaction).filter((name) => name.endsWith('.original'))
    check('EDUCATE external hard-link mutation → changed original remains quarantined', quarantines.length === 1)
    if (quarantines.length === 1) {
      check(
        'EDUCATE external hard-link mutation → quarantine exposes alias bytes',
        readFileSync(join(transaction, quarantines[0]), 'utf8') === 'external hard-link mutation\n'
      )
    }
  }
} finally {
  rmSync(aliasRace, { recursive: true, force: true })
  rmSync(aliasOutside, { recursive: true, force: true })
}

// Replace the hostile leaf after its last validation but before the move. The
// replacement is what moves into quarantine and therefore fails identity checks;
// snapshot bytes are restored without deleting either observed inode.
const removalRace = fixture(authoringOnlyText)
try {
  const config = join(removalRace, '.ki-config.toml')
  const originalInode = lstatSync(config).ino
  const result = runInitWithEnv(removalRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_REPLACE_AFTER_VALIDATION: '# validation-gap replacement\n'
  })
  const transactions = transactionArtifacts(removalRace)
  check('EDUCATE validation/removal replacement → refuses', result.code !== 0)
  check('EDUCATE validation/removal replacement → restores snapshot bytes', readFileSync(config, 'utf8') === authoringOnlyText)
  check(
    'EDUCATE validation/removal replacement → preserves displaced original inode',
    lstatSync(`${config}.ki-test-original-after-validation`).ino === originalInode
  )
  check('EDUCATE validation/removal replacement → preserves private evidence', transactions.length === 1)
  if (transactions.length === 1) {
    const transaction = join(removalRace, transactions[0])
    const quarantines = readdirSync(transaction).filter((name) => name.endsWith('.original'))
    check(
      'EDUCATE validation/removal replacement → moved replacement identity and bytes survive',
      quarantines.length === 1 &&
        lstatSync(join(transaction, quarantines[0])).ino !== originalInode &&
        readFileSync(join(transaction, quarantines[0]), 'utf8') === '# validation-gap replacement\n'
    )
  }
} finally {
  rmSync(removalRace, { recursive: true, force: true })
}

// The positional path is physically resolved once. A symlinked route reaches the
// bound directory, while a deterministic root swap before publication is refused.
const physicalTarget = fixture(null)
const targetAlias = `${physicalTarget}-alias`
try {
  symlinkSync(physicalTarget, targetAlias, 'dir')
  const result = runInit(targetAlias)
  check('EDUCATE symlinked path component → resolves to physical target', result.code === 0)
  check('EDUCATE symlinked path component → publishes only in physical target', existsSync(join(physicalTarget, '.ki-config.toml')))
} finally {
  rmSync(targetAlias, { force: true })
  rmSync(physicalTarget, { recursive: true, force: true })
}

const rootRace = fixture(authoringOnlyText)
const displacedRoot = `${rootRace}-displaced`
try {
  const result = runInitWithEnv(rootRace, {
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_SWAP_ROOT_BEFORE_PUBLISH: displacedRoot
  })
  check('EDUCATE root continuity race → refuses', result.code !== 0)
  check(
    'EDUCATE root continuity race → preserves bound-root config',
    readFileSync(join(displacedRoot, '.ki-config.toml'), 'utf8') === authoringOnlyText
  )
  check('EDUCATE root continuity race → replacement root receives no config', !existsSync(join(rootRace, '.ki-config.toml')))
  check('EDUCATE root continuity race → no artifacts in bound root', transactionArtifacts(displacedRoot).length === 0)
  check('EDUCATE root continuity race → no artifacts in replacement root', transactionArtifacts(rootRace).length === 0)
} finally {
  rmSync(rootRace, { recursive: true, force: true })
  rmSync(displacedRoot, { recursive: true, force: true })
}

// CONFORM uses the same template and repairs each partial direction. GitHub is a
// deterministic local stub so the real conform CLI can reach its scaffold leg.
const conformMissing = prepareConformFixture(null)
try {
  const result = run(CONFORM, [conformMissing.dir], conformMissing.env)
  const actual = readFileSync(join(conformMissing.dir, '.ki-config.toml'), 'utf8')
  check('CONFORM missing file exits cleanly', result.code === 0)
  check('CONFORM missing file matches audit --educate byte-for-byte', actual === template)
} finally {
  rmSync(conformMissing.dir, { recursive: true, force: true })
}

// Local FILES-1/FILES-3 convergence is independent of GitHub. These fixtures are
// not git repos and have no remote; CONFORM may still stop before its live layer,
// but the local config repair must already be complete.
const localConformMissing = fixture(null)
try {
  run(CONFORM, [localConformMissing])
  const actual = readFileSync(join(localConformMissing, '.ki-config.toml'), 'utf8')
  check('CONFORM without a remote repairs a missing config', actual === template)
} finally {
  rmSync(localConformMissing, { recursive: true, force: true })
}

const localConformPartial = fixture(authoringOnlyText)
try {
  run(CONFORM, [localConformPartial])
  const actual = readFileSync(join(localConformPartial, '.ki-config.toml'), 'utf8')
  check('CONFORM without a remote preserves partial config bytes', actual.startsWith(authoringOnlyText))
  check(
    'CONFORM without a remote appends only the missing root',
    rootCount(actual, 'ki-repo') === 1 && rootCount(actual, 'ki-authoring') === 1
  )
} finally {
  rmSync(localConformPartial, { recursive: true, force: true })
}

const localConformDry = fixture(null)
try {
  run(CONFORM, [localConformDry, '--dry-run'])
  check('CONFORM without a remote keeps dry-run no-write', !existsSync(join(localConformDry, '.ki-config.toml')))
} finally {
  rmSync(localConformDry, { recursive: true, force: true })
}

const conformTwoLeafDry = fixture(authoringOnlyText)
try {
  const config = join(conformTwoLeafDry, '.ki-config.toml')
  chmodSync(config, 0o600)
  const before = lstatSync(config)
  const listing = readdirSync(conformTwoLeafDry).sort().join('\n')
  run(CONFORM, [conformTwoLeafDry, '--dry-run'])
  const after = lstatSync(config)
  check('CONFORM two-leaf dry-run → config bytes unchanged', readFileSync(config, 'utf8') === authoringOnlyText)
  check(
    'CONFORM two-leaf dry-run → config identity/mode unchanged',
    after.dev === before.dev && after.ino === before.ino && after.mode === before.mode
  )
  check('CONFORM two-leaf dry-run → gitignore remains absent', !existsSync(join(conformTwoLeafDry, '.gitignore')))
  check('CONFORM two-leaf dry-run → root listing unchanged', readdirSync(conformTwoLeafDry).sort().join('\n') === listing)
  check('CONFORM two-leaf dry-run → no private transaction', transactionArtifacts(conformTwoLeafDry).length === 0)
} finally {
  rmSync(conformTwoLeafDry, { recursive: true, force: true })
}

// CONFORM owns `.gitignore` and config as one local publication transaction. A
// second-leaf failure restores the first leaf to its exact prior state.
const conformSecondLeafFailure = fixture(null)
try {
  const result = run(CONFORM, [conformSecondLeafFailure], {
    ...process.env,
    NODE_ENV: 'test',
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_FAIL_AFTER_PUBLISH: '1'
  })
  check('CONFORM second-leaf failure → refuses', result.code !== 0)
  check('CONFORM second-leaf failure → rolls config back to absence', !existsSync(join(conformSecondLeafFailure, '.ki-config.toml')))
  check('CONFORM second-leaf failure → rolls gitignore back to absence', !existsSync(join(conformSecondLeafFailure, '.gitignore')))
  check('CONFORM second-leaf failure → no transaction artifacts', transactionArtifacts(conformSecondLeafFailure).length === 0)
} finally {
  rmSync(conformSecondLeafFailure, { recursive: true, force: true })
}

const existingGitignore = fixture(authoringOnlyText)
try {
  const gitignore = join(existingGitignore, '.gitignore')
  const bytes = '# keep exact comments\r\ncustom-build/\r\n'
  writeFileSync(gitignore, bytes)
  chmodSync(gitignore, 0o600)
  run(CONFORM, [existingGitignore])
  check('CONFORM existing gitignore → preserves exact bytes', readFileSync(gitignore, 'utf8') === bytes)
  check('CONFORM existing gitignore → preserves exact mode', (lstatSync(gitignore).mode & 0o7777) === 0o600)
  check('CONFORM existing gitignore → no transaction artifacts', transactionArtifacts(existingGitignore).length === 0)
} finally {
  rmSync(existingGitignore, { recursive: true, force: true })
}

const conformSymlink = fixture(null)
const conformOutside = fixture(null)
try {
  const outsideGitignore = join(conformOutside, '.gitignore')
  writeFileSync(outsideGitignore, '# outside\n')
  symlinkSync(outsideGitignore, join(conformSymlink, '.gitignore'))
  const result = run(CONFORM, [conformSymlink])
  check('CONFORM symlink gitignore → refuses', result.code !== 0)
  check('CONFORM symlink gitignore → preserves outside bytes', readFileSync(outsideGitignore, 'utf8') === '# outside\n')
  check('CONFORM symlink gitignore → creates no config', !existsSync(join(conformSymlink, '.ki-config.toml')))
  check('CONFORM symlink gitignore → no transaction artifacts', transactionArtifacts(conformSymlink).length === 0)
} finally {
  rmSync(conformSymlink, { recursive: true, force: true })
  rmSync(conformOutside, { recursive: true, force: true })
}

const conformDangling = fixture(null)
try {
  symlinkSync(join(conformDangling, 'missing-ignore'), join(conformDangling, '.gitignore'))
  const result = run(CONFORM, [conformDangling])
  check('CONFORM dangling gitignore → refuses', result.code !== 0)
  check('CONFORM dangling gitignore → creates no config', !existsSync(join(conformDangling, '.ki-config.toml')))
  check('CONFORM dangling gitignore → no transaction artifacts', transactionArtifacts(conformDangling).length === 0)
} finally {
  rmSync(conformDangling, { recursive: true, force: true })
}

const conformDirectory = fixture(null)
try {
  mkdirSync(join(conformDirectory, '.gitignore'))
  const result = run(CONFORM, [conformDirectory])
  check('CONFORM directory gitignore → refuses', result.code !== 0)
  check('CONFORM directory gitignore → preserves directory', lstatSync(join(conformDirectory, '.gitignore')).isDirectory())
  check('CONFORM directory gitignore → no transaction artifacts', transactionArtifacts(conformDirectory).length === 0)
} finally {
  rmSync(conformDirectory, { recursive: true, force: true })
}

const conformSpecial = fixture(null)
try {
  if (!MKFIFO) check('CONFORM special gitignore → skipped: mkfifo unavailable', true)
  else {
    execFileSync(MKFIFO, [join(conformSpecial, '.gitignore')])
    const result = run(CONFORM, [conformSpecial])
    check('CONFORM special gitignore → refuses', result.code !== 0)
    check('CONFORM special gitignore → preserves special file', lstatSync(join(conformSpecial, '.gitignore')).isFIFO())
    check('CONFORM special gitignore → no transaction artifacts', transactionArtifacts(conformSpecial).length === 0)
  }
} finally {
  rmSync(conformSpecial, { recursive: true, force: true })
}

const conformCreateRace = fixture(null)
try {
  const result = run(CONFORM, [conformCreateRace], {
    ...process.env,
    NODE_ENV: 'test',
    KI_REPO_TEST_TARGET_LEAF: '.gitignore',
    KI_REPO_TEST_CREATE_BEFORE_PUBLISH: '# concurrent ignore\n'
  })
  check('CONFORM missing gitignore race → refuses', result.code !== 0)
  check(
    'CONFORM missing gitignore race → preserves concurrent bytes',
    readFileSync(join(conformCreateRace, '.gitignore'), 'utf8') === '# concurrent ignore\n'
  )
  check('CONFORM missing gitignore race → does not publish config', !existsSync(join(conformCreateRace, '.ki-config.toml')))
  check('CONFORM missing gitignore race → no transaction artifacts', transactionArtifacts(conformCreateRace).length === 0)
} finally {
  rmSync(conformCreateRace, { recursive: true, force: true })
}

const conformSameByteRace = fixture(authoringOnlyText)
try {
  const config = join(conformSameByteRace, '.ki-config.toml')
  const inode = lstatSync(config).ino
  writeFileSync(join(conformSameByteRace, '.gitignore'), '# existing\n')
  const result = run(CONFORM, [conformSameByteRace], {
    ...process.env,
    NODE_ENV: 'test',
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_REPLACE_SAME_BYTES_BEFORE_PUBLISH: '1'
  })
  check('CONFORM config same-byte/new-inode race → refuses', result.code !== 0)
  check('CONFORM config same-byte/new-inode race → preserves replacement', readFileSync(config, 'utf8') === authoringOnlyText)
  check('CONFORM config same-byte/new-inode race → detects inode change', lstatSync(config).ino !== inode)
  check('CONFORM config same-byte/new-inode race → no transaction artifacts', transactionArtifacts(conformSameByteRace).length === 0)
} finally {
  rmSync(conformSameByteRace, { recursive: true, force: true })
}

// Recreating the second leaf after quarantine cannot be clobbered. CONFORM rolls
// back the first leaf and preserves both the third-party leaf and exact quarantine.
const conformQuarantineRace = fixture(authoringOnlyText)
try {
  const result = run(CONFORM, [conformQuarantineRace], {
    ...process.env,
    NODE_ENV: 'test',
    KI_REPO_TEST_TARGET_LEAF: '.ki-config.toml',
    KI_REPO_TEST_RECREATE_AFTER_QUARANTINE: '# third-party config\n'
  })
  const artifacts = transactionArtifacts(conformQuarantineRace)
  check('CONFORM post-quarantine recreation → refuses', result.code !== 0)
  check(
    'CONFORM post-quarantine recreation → preserves third-party leaf',
    readFileSync(join(conformQuarantineRace, '.ki-config.toml'), 'utf8') === '# third-party config\n'
  )
  check('CONFORM post-quarantine recreation → rolls first leaf back', !existsSync(join(conformQuarantineRace, '.gitignore')))
  check('CONFORM post-quarantine recreation → preserves one exact quarantine', artifacts.length === 1)
  if (artifacts.length === 1) {
    const transaction = join(conformQuarantineRace, artifacts[0])
    const quarantines = readdirSync(transaction).filter((name) => name.endsWith('.original'))
    check('CONFORM post-quarantine recreation → private transaction mode is 0700', (lstatSync(transaction).mode & 0o7777) === 0o700)
    check('CONFORM post-quarantine recreation → one original remains quarantined', quarantines.length === 1)
    check(
      'CONFORM post-quarantine recreation → quarantine has original bytes',
      quarantines.length === 1 && readFileSync(join(transaction, quarantines[0]), 'utf8') === authoringOnlyText
    )
  }
} finally {
  rmSync(conformQuarantineRace, { recursive: true, force: true })
}

const conformDry = prepareConformFixture(null)
try {
  const result = run(CONFORM, [conformDry.dir, '--dry-run'], conformDry.env)
  check('CONFORM dry-run exits cleanly', result.code === 0)
  check('CONFORM dry-run does not write config', !existsSync(join(conformDry.dir, '.ki-config.toml')))
} finally {
  rmSync(conformDry.dir, { recursive: true, force: true })
}

const conformAuthoring = prepareConformFixture(authoringOnlyText)
try {
  const result = run(CONFORM, [conformAuthoring.dir], conformAuthoring.env)
  const actual = readFileSync(join(conformAuthoring.dir, '.ki-config.toml'), 'utf8')
  check('CONFORM authoring-only exits cleanly', result.code === 0)
  check('CONFORM authoring-only preserves existing bytes', actual.startsWith(authoringOnlyText))
  check('CONFORM authoring-only appends only the repo root', rootCount(actual, 'ki-repo') === 1 && rootCount(actual, 'ki-authoring') === 1)
} finally {
  rmSync(conformAuthoring.dir, { recursive: true, force: true })
}

const conformRepo = prepareConformFixture(repoOnlyText)
try {
  const result = run(CONFORM, [conformRepo.dir], conformRepo.env)
  const actual = readFileSync(join(conformRepo.dir, '.ki-config.toml'), 'utf8')
  check('CONFORM repo-only exits cleanly', result.code === 0)
  check('CONFORM repo-only preserves existing bytes', actual.startsWith(repoOnlyText))
  check('CONFORM repo-only appends only the authoring root', rootCount(actual, 'ki-repo') === 1 && rootCount(actual, 'ki-authoring') === 1)
} finally {
  rmSync(conformRepo.dir, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31minit.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32minit.test.ts: all checks passed\x1b[0m')
