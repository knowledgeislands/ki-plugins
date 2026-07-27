import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

export const discoverSkillDirs = (path: string): string[] => {
  const absolutePath = resolve(path)
  if (!existsSync(absolutePath)) return []
  if (!statSync(absolutePath).isDirectory()) return []
  if (existsSync(join(absolutePath, 'SKILL.md'))) return [absolutePath]

  const root =
    basename(absolutePath) === 'skills' || !existsSync(join(absolutePath, 'skills')) ? absolutePath : join(absolutePath, 'skills')
  if (!existsSync(root)) return []

  const skillDirs: string[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') continue
    const first = join(root, entry.name)
    if (existsSync(join(first, 'SKILL.md'))) {
      skillDirs.push(first)
      continue
    }
    for (const child of readdirSync(first, { withFileTypes: true })) {
      if (!child.isDirectory()) continue
      const second = join(first, child.name)
      if (existsSync(join(second, 'SKILL.md'))) skillDirs.push(second)
    }
  }
  return skillDirs.sort()
}

export const listMarkdownFiles = (directory: string): string[] => {
  const markdownFiles: string[] = []
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const entryPath = join(path, entry.name)
      if (entry.isDirectory()) walk(entryPath)
      else if (entry.name.endsWith('.md')) markdownFiles.push(entryPath)
    }
  }
  walk(directory)
  return markdownFiles
}
