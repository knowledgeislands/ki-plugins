/**
 * Shared package.json / .gitignore helpers for ki-bootstrap's linkers.
 *
 * Scripts are added by text splice (never JSON.parse -> JSON.stringify), so untouched parts
 * of package.json — formatting, key order, whether an array is inlined or multi-line — are
 * never rewritten as a side effect. An existing entry for the same key is never overwritten
 * (a repo may have deliberately customized the command).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

export function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

export function hasScript(pkgText: string, name: string): boolean {
  try {
    const pkg = JSON.parse(pkgText) as { scripts?: Record<string, unknown> }
    return !!pkg.scripts && name in pkg.scripts
  } catch {
    return false
  }
}

export function gitignoresPath(gitignore: string, path: string): boolean {
  const pattern = new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`)
  return gitignore.split(/\r?\n/).some((l) => pattern.test(l.trim()))
}

// Splice one or more `"key": "command"` entries into package.json's "scripts" block.
export function ensureScripts(target: string, additions: Array<[string, string]>, dryRun: boolean): void {
  const pkgPath = join(target, 'package.json')
  if (!existsSync(pkgPath)) return

  const pkgText = readFileSync(pkgPath, 'utf8')
  let pkg: { scripts?: Record<string, string> }
  try {
    pkg = JSON.parse(pkgText)
  } catch {
    console.log(`${YELLOW}skip  ${RESET}package.json ${DIM}(not valid JSON — leaving scripts untouched)${RESET}`)
    return
  }

  const pending = additions.filter(([key]) => !pkg.scripts?.[key])
  if (pending.length === 0) return

  for (const [key, command] of pending) console.log(`${GREEN}script${RESET} ${key} -> ${DIM}${command}${RESET}`)
  if (dryRun) return

  // Locate the `"scripts": {` opener, then brace-count to its matching close so
  // an empty (`{}`) or single-line block is handled as well as a multi-line one.
  const openMatch = pkgText.match(/^([ \t]*)"scripts"\s*:\s*\{/m)
  if (!openMatch || openMatch.index === undefined) {
    console.log(`${YELLOW}skip  ${RESET}package.json ${DIM}(no "scripts" block to extend — add one by hand first)${RESET}`)
    return
  }
  const baseIndent = openMatch[1]
  const innerStart = openMatch.index + openMatch[0].length
  let depth = 1
  let i = innerStart
  for (; i < pkgText.length && depth > 0; i++) {
    if (pkgText[i] === '{') depth++
    else if (pkgText[i] === '}') depth--
    if (depth === 0) break
  }
  const closeIdx = i // index of the matching `}`
  const inner = pkgText.slice(innerStart, closeIdx)
  const entryIndent = `${baseIndent}  `
  const newLines = pending.map(([key, command]) => `${entryIndent}"${key}": ${JSON.stringify(command)}`).join(',\n')
  const existing = inner.replace(/\s+$/, '').replace(/,\s*$/, '') // keep entries; drop trailing ws/comma
  const newBlock = existing.trim() ? `${existing},\n${newLines}\n${baseIndent}` : `\n${newLines}\n${baseIndent}`
  const rebuilt = pkgText.slice(0, innerStart) + newBlock + pkgText.slice(closeIdx)
  writeFileSync(pkgPath, rebuilt)
}

// Single-script convenience wrapper.
export function ensureScript(target: string, key: string, command: string, dryRun: boolean): void {
  ensureScripts(target, [[key, command]], dryRun)
}
