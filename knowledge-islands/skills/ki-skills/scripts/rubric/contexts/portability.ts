import type { PortabilityRubricContext } from './contexts.ts'

export type RuntimeAssumption = {
  line: number
  reference: string
}

const RUNTIME_REFERENCES = [
  ['Claude Code', /\bClaude Code\b/g],
  ['Claude Desktop', /\bClaude Desktop\b/g],
  ['ChatGPT', /\bChatGPT\b/g],
  ['Codex', /\bCodex\b/g],
  ['Cowork', /\bCowork\b/g],
  ['Claude', /\bClaude\b(?! (?:Code|Desktop)\b)/g],
  ['~/.claude', /~\/\.claude\b/g],
  ['$HOME/.claude', /\$HOME\/\.claude\b/g],
  ['~/.codex', /~\/\.codex\b/g],
  ['$HOME/.codex', /\$HOME\/\.codex\b/g]
] as const

const runtimeComparison = (line: string): boolean => {
  const namedRuntimes = new Set<string>()
  if (/\bClaude(?: Code| Desktop)?\b/i.test(line)) namedRuntimes.add('claude')
  if (/\bCodex\b/i.test(line)) namedRuntimes.add('codex')
  if (/\bChatGPT\b/i.test(line)) namedRuntimes.add('chatgpt')
  if (/\bCowork\b/i.test(line)) namedRuntimes.add('cowork')
  return namedRuntimes.size >= 2
}

const explicitlyQualifiedRuntimeBinding = (line: string): boolean =>
  /\b(?:runtime[- ](?:specific|only)|Claude[- ]Code[- ](?:specific|only)|CC[- ]only)\b|\(CC\)/i.test(line)

/** Return unqualified runtime references from one skill document. */
export const unqualifiedRuntimeAssumptions = ({
  markdown,
  runtimeBinding,
  attributedSourceMaterial
}: PortabilityRubricContext): readonly RuntimeAssumption[] => {
  if (runtimeBinding || attributedSourceMaterial) return []

  const findings: RuntimeAssumption[] = []
  let runtimeBindingHeadingDepth: number | null = null
  let attributedQuote = false

  for (const [index, line] of markdown.split(/\r?\n/).entries()) {
    const heading = /^(#{2,6})\s+(.+?)\s*$/.exec(line)
    if (heading) {
      const depth = heading[1]?.length ?? 0
      if (runtimeBindingHeadingDepth !== null && depth <= runtimeBindingHeadingDepth) runtimeBindingHeadingDepth = null
      if (/^runtime (?:bindings?|overlay)\b/i.test(heading[2] ?? '')) runtimeBindingHeadingDepth = depth
    }

    if (/^>\s*(?:\*\*)?Source(?:\*\*)?:\s+/i.test(line)) attributedQuote = true
    else if (!line.startsWith('>')) attributedQuote = false

    if (runtimeBindingHeadingDepth !== null || attributedQuote || runtimeComparison(line) || explicitlyQualifiedRuntimeBinding(line))
      continue

    const references = new Set<string>()
    for (const [reference, pattern] of RUNTIME_REFERENCES) {
      pattern.lastIndex = 0
      if (pattern.test(line)) references.add(reference)
    }
    for (const reference of references) findings.push({ line: index + 1, reference })
  }

  return findings
}
