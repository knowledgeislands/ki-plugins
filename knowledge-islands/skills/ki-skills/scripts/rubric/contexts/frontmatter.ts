type BunYamlRuntime = { Bun: { YAML: { parse: (source: string) => unknown } } }

export type ParsedFrontmatter = {
  keys: Map<string, string>
  present: Set<string>
  raw: string | null
  values: Record<string, unknown>
  isMapping: boolean
}

export const frontmatterBlock = (content: string): string | null => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? (match[1] as string) : null
}

const stripFrontmatterQuotes = (value: string): string => {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export const parseFrontmatter = (content: string): ParsedFrontmatter => {
  const keys = new Map<string, string>()
  const present = new Set<string>()
  const raw = frontmatterBlock(content)
  if (raw === null) return { keys, present, raw, values: {}, isMapping: false }

  let values: Record<string, unknown> = {}
  let isMapping = false
  try {
    const parsed = (globalThis as typeof globalThis & BunYamlRuntime).Bun.YAML.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      values = parsed as Record<string, unknown>
      isMapping = true
    }
  } catch {
    // The frontmatter rubric reports malformed YAML before dependent fields are read.
  }

  const lines = raw.split(/\r?\n/)
  let index = 0
  while (index < lines.length) {
    const line = lines[index] as string
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      index++
      continue
    }
    const keyValue = line.match(/^([A-Za-z0-9_-]+):(.*)$/)
    if (!keyValue) {
      index++
      continue
    }
    const key = keyValue[1] as string
    const value = (keyValue[2] as string).trim()
    present.add(key)
    if (value === '>' || value === '|' || value.startsWith('> ') || value.startsWith('| ') || /^[>|][-+]?\d*\s*$/.test(value)) {
      const folded = value[0] === '>'
      const collected: string[] = []
      index++
      while (index < lines.length) {
        const nextLine = lines[index] as string
        if (nextLine.trim() !== '' && !/^\s/.test(nextLine)) break
        if (nextLine.trim() !== '') collected.push(nextLine.trim())
        index++
      }
      keys.set(key, folded ? collected.join(' ') : collected.join('\n'))
      continue
    }
    if (value === '') {
      index++
      while (index < lines.length && /^\s+\S/.test(lines[index] as string)) index++
      keys.set(key, '')
      continue
    }
    keys.set(key, stripFrontmatterQuotes(value))
    index++
  }
  return { keys, present, raw, values, isMapping }
}

export const frontmatterLine = (block: string, key: string): string | null => {
  const match = block.match(new RegExp(`^${key}:.*$`, 'm'))
  return match ? (match[0] as string) : null
}

export const insertFrontmatterLine = (block: string, newLine: string): string => {
  for (const anchorKey of ['ki-depends-on', 'name']) {
    const anchor = frontmatterLine(block, anchorKey)
    if (anchor) return block.replace(anchor, `${anchor}\n${newLine}`)
  }
  return `${newLine}\n${block}`
}

export const frontmatterScalar = (line: string, key: string): string => {
  const match = line.match(new RegExp(`^${key}:\\s*(['"]?)([\\s\\S]*?)\\1\\s*$`))
  return match ? (match[2] as string) : line.replace(new RegExp(`^${key}:\\s*`), '')
}

export const replaceFrontmatterScalar = (block: string, key: string, value: string): string => {
  const line = frontmatterLine(block, key)
  if (!line) return block
  const quote = line.match(new RegExp(`^${key}:\\s*(['"]?)`))?.[1] || "'"
  return block.replace(line, `${key}: ${quote}${value.trim()}${quote}`)
}
