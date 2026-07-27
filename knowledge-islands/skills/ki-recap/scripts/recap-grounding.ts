#!/usr/bin/env bun

/**
 * Grounding helper for ki-recap (not a checker — no severity ladder or exit-1 contract).
 *
 * Usage: bun skills/process/ki-recap/scripts/recap-grounding.ts [repo-path] [--json]
 *   [--runtime detect|claude|codex] [--transcripts-dir <dir>] [--transcript <session-file>]
 *
 * The helper selects the newest eligible transcript for the resolved repository. Claude
 * candidates live directly in its derived project directory; Codex candidates are regular
 * JSONL files discovered recursively below its sessions directory whose session metadata
 * names the same working directory. It emits files touched, a tool-call tally, and
 * high-cost candidates for the warm recap procedure to interpret.
 */

import { execFileSync } from 'node:child_process'
import { type Dirent, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, isAbsolute, join, resolve } from 'node:path'

type Runtime = 'claude' | 'codex'
type RuntimeSelector = Runtime | 'detect'

type ToolCall = {
  name: string
  input: unknown
}

type TranscriptCandidate = {
  runtime: Runtime
  path: string
  mtime: number
}

type Grounding = {
  repo: string
  runtime: Runtime | null
  transcript: string | null
  filesTouched: string[]
  diffStat: string
  toolTally: Record<string, number>
  highCostCandidates: string[]
}

type Arguments = {
  jsonMode: boolean
  repoArg: string | undefined
  runtime: RuntimeSelector
  transcriptsDir: string | undefined
  transcriptSelector: string | undefined
}

const slugifyRepoPath = (absolutePath: string): string => absolutePath.replace(/[/.]/g, '-')

const resolveClaudeProjectDir = (repo: string): string => join(homedir(), '.claude', 'projects', slugifyRepoPath(repo))

const resolveCodexSessionsDir = (): string => join(homedir(), '.codex', 'sessions')

const readJsonl = (path: string): unknown[] => {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return []
  }

  const records: unknown[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      records.push(JSON.parse(line) as unknown)
    } catch {
      // Malformed transcript lines are not evidence and must not stop grounding.
    }
  }
  return records
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const codexTranscriptCwd = (records: readonly unknown[]): string | null => {
  for (const record of records) {
    const event = asRecord(record)
    if (event?.type !== 'session_meta') continue
    const payload = asRecord(event.payload)
    if (typeof payload?.cwd === 'string') return resolve(payload.cwd)
  }
  return null
}

const regularJsonlFiles = (directory: string, recursive: boolean): string[] => {
  let entries: Dirent[]
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch {
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(path)
    else if (recursive && entry.isDirectory()) files.push(...regularJsonlFiles(path, true))
  }
  return files
}

const candidate = (runtime: Runtime, path: string): TranscriptCandidate => ({ runtime, path, mtime: statSync(path).mtimeMs })

const claudeCandidates = (directory: string): TranscriptCandidate[] =>
  regularJsonlFiles(directory, false)
    .filter((path) => codexTranscriptCwd(readJsonl(path)) === null)
    .map((path) => candidate('claude', path))

const codexCandidates = (directory: string, repo: string): TranscriptCandidate[] =>
  regularJsonlFiles(directory, true)
    .filter((path) => codexTranscriptCwd(readJsonl(path)) === repo)
    .map((path) => candidate('codex', path))

const candidateDirectories = ({ repo, transcriptsDir }: Pick<Arguments, 'transcriptsDir'> & { repo: string }) => ({
  claude: transcriptsDir ? resolve(transcriptsDir) : resolveClaudeProjectDir(repo),
  codex: transcriptsDir ? resolve(transcriptsDir) : resolveCodexSessionsDir()
})

const discoverCandidates = ({
  runtime,
  repo,
  transcriptsDir
}: Pick<Arguments, 'runtime' | 'transcriptsDir'> & { repo: string }): TranscriptCandidate[] => {
  const directories = candidateDirectories({ repo, transcriptsDir })
  if (runtime === 'claude') return claudeCandidates(directories.claude)
  if (runtime === 'codex') return codexCandidates(directories.codex, repo)
  return [...claudeCandidates(directories.claude), ...codexCandidates(directories.codex, repo)]
}

const selectTranscript = (candidates: readonly TranscriptCandidate[], selector: string | undefined): TranscriptCandidate | null => {
  if (!selector) return [...candidates].sort((left, right) => right.mtime - left.mtime)[0] ?? null
  if (
    selector.length <= '.jsonl'.length ||
    !selector.endsWith('.jsonl') ||
    isAbsolute(selector) ||
    basename(selector) !== selector ||
    selector.includes('\\')
  )
    throw new Error('`--transcript` must be a basename ending in .jsonl from the eligible transcript candidates')

  const matches = candidates.filter((candidate_) => basename(candidate_.path) === selector)
  if (matches.length === 0) throw new Error(`selected transcript is not an eligible regular file: ${selector}`)
  if (matches.length > 1) throw new Error(`selected transcript basename is ambiguous across eligible candidates: ${selector}`)
  return matches[0] ?? null
}

const printHelp = (): void => {
  console.log(`Usage: recap-grounding.ts [repo-path] [--json] [--runtime detect|claude|codex] [--transcripts-dir <dir>] [--transcript <session-file>]

Ground a live ki-recap with current repository and Claude or Codex transcript data.

Arguments:
  repo-path                  Repository to inspect (default: current directory)

Options:
  --json                     Emit machine-readable JSON
  --runtime <value>          detect (default), claude, or codex
  --transcripts-dir <dir>    Override the selected runtime transcript root
  --transcript <file>        Select one eligible transcript by basename
  -h, --help, ?              Show this help and exit`)
}

const parseArguments = (args: string[]): Arguments => {
  let jsonMode = false
  let repoArg: string | undefined
  let runtime: RuntimeSelector = 'detect'
  let transcriptsDir: string | undefined
  let transcriptSelector: string | undefined

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] as string
    if (argument === '--json') {
      jsonMode = true
      continue
    }
    if (argument === '--runtime' || argument === '--transcripts-dir' || argument === '--transcript') {
      const value = args[index + 1]
      if (!value || value.startsWith('--')) throw new Error(`\`${argument}\` requires a value`)
      if (argument === '--runtime') {
        if (!['detect', 'claude', 'codex'].includes(value)) throw new Error('`--runtime` accepts detect, claude, or codex')
        runtime = value as RuntimeSelector
      } else if (argument === '--transcripts-dir') transcriptsDir = value
      else transcriptSelector = value
      index += 1
      continue
    }
    if (argument.startsWith('--')) throw new Error(`unknown option: ${argument}`)
    if (repoArg) throw new Error(`unexpected argument: ${argument}`)
    repoArg = argument
  }

  return { jsonMode, repoArg, runtime, transcriptsDir, transcriptSelector }
}

const toolInput = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

const readToolCalls = (transcriptPath: string, runtime: Runtime): ToolCall[] => {
  const calls: ToolCall[] = []
  for (const record of readJsonl(transcriptPath)) {
    const event = asRecord(record)
    if (!event) continue

    if (runtime === 'claude') {
      const message = asRecord(event.message)
      const content = message?.content
      if (!Array.isArray(content)) continue
      for (const block of content) {
        const tool = asRecord(block)
        if (tool?.type === 'tool_use' && typeof tool.name === 'string') calls.push({ name: tool.name, input: tool.input })
      }
      continue
    }

    if (event.type !== 'response_item') continue
    const item = asRecord(event.payload)
    const payload = asRecord(item?.item) ?? item
    if (!payload || (payload.type !== 'function_call' && payload.type !== 'custom_tool_call') || typeof payload.name !== 'string') continue
    calls.push({ name: payload.name, input: toolInput(payload.arguments ?? payload.input) })
  }
  return calls
}

const gitOutput = (repo: string, args: string[]): string => {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const findHighCostCandidates = (calls: readonly ToolCall[]): string[] => {
  const candidates: string[] = []
  const signatureTally = new Map<string, number>()
  for (const call of calls) {
    const signature = `${call.name}:${JSON.stringify(call.input)}`
    signatureTally.set(signature, (signatureTally.get(signature) ?? 0) + 1)
  }
  for (const [signature, count] of signatureTally) {
    if (count >= 3) candidates.push(`repeated identical ${signature.split(':')[0]} call (${count}x)`)
  }

  const readTally = new Map<string, number>()
  for (const call of calls) {
    if (call.name !== 'Read') continue
    const input = asRecord(call.input)
    if (typeof input?.file_path !== 'string') continue
    readTally.set(input.file_path, (readTally.get(input.file_path) ?? 0) + 1)
  }
  for (const [path, count] of readTally) if (count >= 2) candidates.push(`re-read of ${path} (${count}x)`)
  return candidates
}

const main = (): void => {
  const rawArgs = process.argv.slice(2)
  if (rawArgs.some((argument) => ['-h', '--help', '?'].includes(argument))) {
    printHelp()
    return
  }

  const { jsonMode, repoArg, runtime, transcriptsDir, transcriptSelector } = parseArguments(rawArgs)
  const repo = resolve(repoArg ?? process.cwd())
  const selected = selectTranscript(discoverCandidates({ runtime, repo, transcriptsDir }), transcriptSelector)
  const calls = selected ? readToolCalls(selected.path, selected.runtime) : []
  const toolTally: Record<string, number> = {}
  for (const call of calls) toolTally[call.name] = (toolTally[call.name] ?? 0) + 1

  const grounding: Grounding = {
    repo,
    runtime: selected?.runtime ?? null,
    transcript: selected?.path ?? null,
    filesTouched: gitOutput(repo, ['status', '--porcelain'])
      .split('\n')
      .filter(Boolean)
      .map((line) => line.trim()),
    diffStat: gitOutput(repo, ['diff', '--stat']),
    toolTally,
    highCostCandidates: findHighCostCandidates(calls)
  }

  if (jsonMode) {
    console.log(JSON.stringify(grounding, null, 2))
    return
  }

  console.log(`repo: ${grounding.repo}`)
  console.log(`runtime: ${grounding.runtime ?? '(none found)'}`)
  console.log(`transcript: ${grounding.transcript ?? '(none found)'}`)
  console.log(`files touched: ${grounding.filesTouched.length}`)
  console.log(grounding.diffStat || '(no diff)')
  console.log(`tool tally: ${JSON.stringify(grounding.toolTally)}`)
  if (grounding.highCostCandidates.length > 0) {
    console.log('high-cost candidates:')
    for (const candidate_ of grounding.highCostCandidates) console.log(`  - ${candidate_}`)
  }
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`recap-grounding: ${message}`)
  process.exitCode = 1
}
