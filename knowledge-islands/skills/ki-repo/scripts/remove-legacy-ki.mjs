#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { lstatSync, readdirSync, realpathSync, rmdirSync, rmSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const repository = realpathSync(resolve(process.argv[2] ?? '.'))
const legacyRoot = join(repository, '.ki')
const removableRoots = new Set(['audits', 'conform'])

const fail = (message) => {
  process.stderr.write(`legacy .ki cleanup refused: ${message}\n`)
  process.exit(1)
}

let state
try {
  state = lstatSync(legacyRoot)
} catch {
  process.exit(0)
}

if (!state.isDirectory() || state.isSymbolicLink()) {
  fail('.ki is not a physical directory')
}

const tracked = execFileSync('git', ['-C', repository, 'ls-files', '--', '.ki'], {
  encoding: 'utf8'
}).trim()
if (tracked) {
  fail(`.ki contains tracked paths: ${tracked.split(/\r?\n/).join(', ')}`)
}

const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name)
    const relativePath = relative(legacyRoot, absolute)
    const owner = relativePath.split(sep)[0]

    if (entry.isSymbolicLink()) fail(`symlink found at .ki/${relativePath}`)
    if (!owner || !removableRoots.has(owner)) {
      fail(`unrecognised path .ki/${relativePath}`)
    }
    if (entry.isDirectory()) walk(absolute)
    else if (!entry.isFile()) fail(`non-regular path .ki/${relativePath}`)
  }
}

walk(legacyRoot)
for (const name of removableRoots) {
  rmSync(join(legacyRoot, name), { recursive: true, force: true })
}

try {
  rmdirSync(legacyRoot)
} catch {
  fail('.ki contains unrecognised content after removing known legacy outputs')
}

process.stdout.write('removed untracked legacy .ki/audits and .ki/conform output\n')
