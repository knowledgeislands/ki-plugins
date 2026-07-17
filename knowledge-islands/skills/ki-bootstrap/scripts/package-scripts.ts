/**
 * Shared `.gitignore` helpers for ki-bootstrap's linkers.
 *
 * The linkers create relative symlinks under `.claude/skills/` / `.claude/agents/`
 * and keep those generated paths gitignored; these helpers are the gitignore side.
 * ki-bootstrap writes no `package.json` — the `ki:*` convenience keys are
 * ki-engineering's to wire, as sugar over the vendored `.ki-meta/bin/*` wrappers.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

// ── Multi-runtime target resolution ──────────────────────────────────────────
// A repo declares which agent runtimes it installs skills/agents for via
// `[ki-repo] target_runtimes = [...]` — a repo-wide fact, not a harness-structure
// detail. Absent → the historical default ["claude-code"], so every repo predating
// multi-runtime support is unchanged. Parsing is table-aware so a lookalike key
// in another table or a multiline string cannot redirect runtime installation.
// Discovery paths differ per runtime: Claude Code reads `.claude/`, OpenAI Codex
// CLI reads `.agents/` (the runtime feature-coverage matrix, SDR-KI-HARNESS-002).
export function targetRuntimes(kiConfigText: string): string[] {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(kiConfigText) as Record<string, unknown>
  } catch {
    return ['claude-code']
  }
  const repo = document['ki-repo']
  if (!repo || typeof repo !== 'object' || Array.isArray(repo)) return ['claude-code']
  const runtimes = (repo as Record<string, unknown>).target_runtimes
  if (!Array.isArray(runtimes)) return ['claude-code']
  const list = runtimes.filter((runtime): runtime is string => typeof runtime === 'string')
  return list.length ? list : ['claude-code']
}

// Where each runtime discovers project-local SKILLS. Unknown runtime → throw
// (fail loud rather than silently install into a guessed path).
export function runtimeSkillsDir(runtime: string): string {
  const map: Record<string, string> = {
    'claude-code': join('.claude', 'skills'),
    codex: join('.agents', 'skills')
  }
  const dir = map[runtime]
  if (!dir) throw new Error(`unknown target_runtime "${runtime}" — no known skills path (expected one of: ${Object.keys(map).join(', ')})`)
  return dir
}

// Where each runtime discovers project-local AGENTS. Claude Code uses Markdown+YAML
// under `.claude/agents/`; Codex uses TOML under `~/.codex/agents/` with a different
// field shape (name/description/developer_instructions) — a generator, not a symlink,
// and not yet built (the open subagent-format item in SDR-KI-HARNESS-002). Codex is
// therefore intentionally absent here: link-agents surfaces a clear "unsupported
// pending format spike" message for it rather than guess a path.
export function runtimeAgentsDir(runtime: string): string {
  const map: Record<string, string> = {
    'claude-code': join('.claude', 'agents')
  }
  const dir = map[runtime]
  if (!dir)
    throw new Error(
      `target_runtime "${runtime}" has no supported project-local agents path yet — Codex subagents are TOML under ~/.codex/agents/ (a generator, not a symlink), pending the format spike (SDR-KI-HARNESS-002)`
    )
  return dir
}

export function gitignoresPath(gitignore: string, path: string): boolean {
  const pattern = new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`)
  return gitignore.split(/\r?\n/).some((l) => pattern.test(l.trim()))
}

// Append a generated-links ignore for `path` (e.g. `.claude/skills`) if the .gitignore
// does not already cover it. Writes the trailing-slash form the checker (gitignoresPath)
// recognises, so a natural leading-slash guess never leaves BOOT-3/8 unsatisfied. Creates
// .gitignore if absent; leaves existing content untouched otherwise.
export function ensureGitignore(target: string, path: string, dryRun: boolean): void {
  const gitignorePath = join(target, '.gitignore')
  const existing = readText(gitignorePath)
  if (gitignoresPath(existing, path)) return
  const line = `${path}/`
  console.log(`${GREEN}ignore${RESET} ${line} ${DIM}(generated links)${RESET}`)
  if (dryRun) return
  const lead = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n'
  writeFileSync(gitignorePath, `${existing}${lead}# Generated project-local links (ki-bootstrap) — never committed\n${line}\n`)
}
