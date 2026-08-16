#!/usr/bin/env bun

/**
 * Purpose: Ground a ki-recap from current repository and eligible runtime transcripts.
 * Run: bun scripts/recap-grounding.ts --help
 * Boundary: Read-only; it reads the selected repository's Git state and eligible Claude
 * or Codex transcript files, then emits evidence for the recap procedure to interpret.
 *
 * This is not a checker, so it has no severity ladder or exit-1 finding contract.
 *
 * Usage: bun scripts/recap-grounding.ts [repo-path] [--json]
 *   [--runtime detect|claude|codex] [--transcripts-dir <dir>] [--transcript <session-file>]
 *
 * The helper selects the newest eligible transcript for the resolved repository. Claude
 * candidates live directly in its derived project directory; Codex candidates are regular
 * JSONL files discovered recursively below its sessions directory whose session metadata
 * names the same working directory. It emits files touched, a tool-call tally,
 * high-cost candidates, and repository evidence for the warm recap procedure to interpret.
 */

import { execFileSync } from 'node:child_process'
import { type Dirent, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, isAbsolute, join, resolve } from 'node:path'

type Runtime = 'claude' | 'codex'
type RuntimeSelector = Runtime | 'detect'

type ToolCall = {
  name: string
  input: unknown
}

type WorktreeState = 'clean' | 'dirty'

type RepositoryEvidence = {
  repo: string
  head: string | null
  worktree: WorktreeState
}

type TranscriptEvidence = {
  status: 'unchanged' | 'changed' | 'unavailable'
  baseline: RepositoryEvidence | null
  current: RepositoryEvidence | null
  commitRange?: string
  changedPaths?: string[]
}

type RepositoryGrounding =
  | {
      status: 'available'
      root: string
      evidence: RepositoryEvidence
      filesTouched: string[]
      stagedFiles: string[]
      unstagedFiles: string[]
      untrackedFiles: string[]
      diffStat: string
    }
  | { status: 'unavailable'; root: null; reason: string }

type TranscriptCandidate = {
  runtime: Runtime
  path: string
  mtime: number
}

type Grounding = {
  repo: string
  repository: RepositoryGrounding
  runtime: Runtime | null
  transcript: string | null
  filesTouched: string[]
  stagedFiles: string[]
  unstagedFiles: string[]
  untrackedFiles: string[]
  diffStat: string
  toolTally: Record<string, number>
  highCostCandidates: string[]
  'ki-work-recap-repository-evidence/v1': RepositoryEvidence | null
  transcriptEvidence: TranscriptEvidence
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
const REPOSITORY_EVIDENCE_MARKER = 'ki-work-recap-repository-evidence/v1'
const COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/

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
    if (typeof payload?.cwd === 'string') {
      try {
        return realpathSync(resolve(payload.cwd))
      } catch {
        return null
      }
    }
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

const candidate = (runtime: Runtime, path: string): TranscriptCandidate => ({
  runtime,
  path,
  mtime: statSync(path).mtimeMs
})

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

const selectTranscript = (
  candidates: readonly TranscriptCandidate[],
  selector: string | undefined
): TranscriptCandidate | null => {
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
  if (matches.length > 1)
    throw new Error(`selected transcript basename is ambiguous across eligible candidates: ${selector}`)
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
        if (!['detect', 'claude', 'codex'].includes(value))
          throw new Error('`--runtime` accepts detect, claude, or codex')
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

const textValues = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap((entry) => textValues(entry))
  const record = asRecord(value)
  return typeof record?.text === 'string' ? [record.text] : []
}

const repositoryEvidence = (value: unknown, repository: string): RepositoryEvidence | null => {
  const record = asRecord(value)
  const marker = asRecord(record?.[REPOSITORY_EVIDENCE_MARKER])
  if (
    !marker ||
    typeof marker.repo !== 'string' ||
    (marker.head !== null && (typeof marker.head !== 'string' || !COMMIT.test(marker.head)))
  )
    return null
  if (marker.worktree !== 'clean' && marker.worktree !== 'dirty') return null
  try {
    if (realpathSync(marker.repo) !== repository) return null
  } catch {
    return null
  }
  return { repo: repository, head: marker.head as string | null, worktree: marker.worktree }
}

const helperOutputEvidence = (text: string, repository: string): RepositoryEvidence | null => {
  try {
    return repositoryEvidence(JSON.parse(text) as unknown, repository)
  } catch {
    return null
  }
}

const transcriptOutputTexts = (transcriptPath: string, runtime: Runtime): string[] => {
  const texts: string[] = []
  for (const record of readJsonl(transcriptPath)) {
    const event = asRecord(record)
    if (!event) continue
    if (runtime === 'claude') {
      const message = asRecord(event.message)
      const content = message?.content
      if (!Array.isArray(content)) continue
      for (const block of content) {
        const result = asRecord(block)
        if (result?.type === 'tool_result') texts.push(...textValues(result.content))
      }
      continue
    }
    if (event.type !== 'response_item') continue
    const item = asRecord(event.payload)
    const payload = asRecord(item?.item) ?? item
    if (payload?.type === 'custom_tool_call_output') texts.push(...textValues(payload.output))
  }
  return texts
}

const latestTranscriptEvidence = (
  selected: TranscriptCandidate | null,
  repository: string
): RepositoryEvidence | null => {
  if (!selected) return null
  return (
    transcriptOutputTexts(selected.path, selected.runtime)
      .map((text) => helperOutputEvidence(text, repository))
      .filter((evidence): evidence is RepositoryEvidence => evidence !== null)
      .at(-1) ?? null
  )
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
        if (tool?.type === 'tool_use' && typeof tool.name === 'string')
          calls.push({ name: tool.name, input: tool.input })
      }
      continue
    }

    if (event.type !== 'response_item') continue
    const item = asRecord(event.payload)
    const payload = asRecord(item?.item) ?? item
    if (
      !payload ||
      (payload.type !== 'function_call' && payload.type !== 'custom_tool_call') ||
      typeof payload.name !== 'string'
    )
      continue
    calls.push({ name: payload.name, input: toolInput(payload.arguments ?? payload.input) })
  }
  return calls
}

const gitOutput = (repo: string, args: string[]): string | null => {
  try {
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

const lines = (value: string): string[] => value.split('\n').filter(Boolean)

const resolveRepository = (path: string): string | null => {
  const root = gitOutput(path, ['rev-parse', '--show-toplevel'])
  if (!root) return null
  try {
    return realpathSync(root)
  } catch {
    return null
  }
}

const groundRepository = (path: string): RepositoryGrounding => {
  const root = resolveRepository(path)
  if (!root) return { status: 'unavailable', root: null, reason: 'Git top-level root could not be resolved.' }
  const head = gitOutput(root, ['rev-parse', 'HEAD'])
  const porcelain = gitOutput(root, ['status', '--porcelain'])
  const stagedStat = gitOutput(root, ['diff', '--cached', '--stat'])
  const unstagedStat = gitOutput(root, ['diff', '--stat'])
  const stagedNames = gitOutput(root, ['diff', '--cached', '--name-only'])
  const unstagedNames = gitOutput(root, ['diff', '--name-only'])
  if (head === null || porcelain === null || stagedStat === null || unstagedStat === null)
    return { status: 'unavailable', root: null, reason: 'Git state could not be read completely.' }
  if (stagedNames === null || unstagedNames === null)
    return { status: 'unavailable', root: null, reason: 'Git change paths could not be read completely.' }
  const stagedFiles = lines(stagedNames)
  const unstagedFiles = lines(unstagedNames)
  const untrackedFiles = lines(porcelain)
    .filter((line) => line.startsWith('?? '))
    .map((line) => line.slice(3))
  const filesTouched = lines(porcelain).map((line) => line.trim())
  return {
    status: 'available',
    root,
    evidence: { repo: root, head: head || null, worktree: filesTouched.length ? 'dirty' : 'clean' },
    filesTouched,
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    diffStat: [stagedStat, unstagedStat].filter(Boolean).join('\n')
  }
}

const compareEvidence = (
  repo: string,
  baseline: RepositoryEvidence | null,
  current: RepositoryEvidence | null
): TranscriptEvidence => {
  if (!current || !baseline?.head || !current.head) return { status: 'unavailable', baseline, current }
  if (
    !gitOutput(repo, ['rev-parse', '--verify', `${baseline.head}^{commit}`]) ||
    !gitOutput(repo, ['rev-parse', '--verify', `${current.head}^{commit}`])
  )
    return { status: 'unavailable', baseline, current }
  if (baseline.head === current.head && baseline.worktree === 'clean' && current.worktree === 'clean')
    return { status: 'unchanged', baseline, current }

  const changed = baseline.head !== current.head || baseline.worktree !== current.worktree
  if (!changed) return { status: 'unavailable', baseline, current }
  if (baseline.head === current.head) return { status: 'changed', baseline, current }

  const commitRange = `${baseline.head}..${current.head}`
  const changedPaths = lines(gitOutput(repo, ['diff', '--name-only', commitRange]) ?? '')
  return { status: 'changed', baseline, current, commitRange, changedPaths }
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
  const requestedPath = resolve(repoArg ?? process.cwd())
  const repository = groundRepository(requestedPath)
  const repo = repository.status === 'available' ? repository.root : requestedPath
  const selected = selectTranscript(discoverCandidates({ runtime, repo, transcriptsDir }), transcriptSelector)
  const calls = selected ? readToolCalls(selected.path, selected.runtime) : []
  const currentEvidence = repository.status === 'available' ? repository.evidence : null
  const baseline = currentEvidence ? latestTranscriptEvidence(selected, repo) : null
  const toolTally: Record<string, number> = {}
  for (const call of calls) toolTally[call.name] = (toolTally[call.name] ?? 0) + 1

  const grounding: Grounding = {
    repo,
    repository,
    runtime: selected?.runtime ?? null,
    transcript: selected?.path ?? null,
    filesTouched: repository.status === 'available' ? repository.filesTouched : [],
    stagedFiles: repository.status === 'available' ? repository.stagedFiles : [],
    unstagedFiles: repository.status === 'available' ? repository.unstagedFiles : [],
    untrackedFiles: repository.status === 'available' ? repository.untrackedFiles : [],
    diffStat: repository.status === 'available' ? repository.diffStat : '',
    toolTally,
    highCostCandidates: findHighCostCandidates(calls),
    [REPOSITORY_EVIDENCE_MARKER]: currentEvidence,
    transcriptEvidence: compareEvidence(repo, baseline, currentEvidence)
  }

  if (jsonMode) {
    console.log(JSON.stringify(grounding, null, 2))
    return
  }

  console.log(`repo: ${grounding.repo}`)
  console.log(`runtime: ${grounding.runtime ?? '(none found)'}`)
  console.log(`transcript: ${grounding.transcript ?? '(none found)'}`)
  console.log(`repository: ${grounding.repository.status}`)
  if (grounding.repository.status === 'unavailable') console.log(`repository reason: ${grounding.repository.reason}`)
  console.log(`files touched: ${grounding.filesTouched.length}`)
  console.log(grounding.diffStat || '(no diff)')
  console.log(`tool tally: ${JSON.stringify(grounding.toolTally)}`)
  console.log(`transcript evidence: ${grounding.transcriptEvidence.status}`)
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
