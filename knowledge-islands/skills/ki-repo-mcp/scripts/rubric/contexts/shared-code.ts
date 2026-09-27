import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type { ConformWrite } from '../../shared/rubric.ts'

const OWNER = 'ki-repo-mcp'
const ASSET_ROOT = resolve(import.meta.dir, '../../../assets/shared-code')
const MANAGED_MARKER = /^\/\/ @ki-managed ki-repo-mcp profile=([^\s]+) version=([^\s]+)$/m

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'

type ManifestFile = {
  readonly source: string
  readonly destination: string
  readonly sha256: string
}

type ManifestProfile = {
  readonly requires: readonly string[]
  readonly files: readonly ManifestFile[]
}

type Manifest = {
  readonly contract: number
  readonly owner: string
  readonly profiles: Readonly<Record<string, ManifestProfile>>
}

export type ManagedFileState = 'exact' | 'missing' | 'modified' | 'unsafe' | 'asset-invalid'

export type McpManagedFileEvidence = {
  readonly destination: string
  readonly sha256: string
  readonly state: ManagedFileState
}

export type McpSharedCodeContext = {
  readonly profile: unknown
  readonly supportedProfiles: readonly string[]
  readonly files: readonly McpManagedFileEvidence[]
  readonly missingRequirements: readonly string[]
  readonly obsoleteManagedFiles: readonly string[]
  readonly localExtensions: readonly string[]
  readonly conformMissing?: () => void
}

const nodeKind = (path: string): NodeKind => {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return 'unsafe'
    if (stat.isFile()) return 'file'
    if (stat.isDirectory()) return 'directory'
    return 'unsafe'
  } catch {
    return 'missing'
  }
}

const digest = (content: string): string => createHash('sha256').update(content).digest('hex')

const contained = (root: string, path: string): boolean => {
  const value = relative(root, path)
  return value !== '' && !isAbsolute(value) && value !== '..' && !value.startsWith('../')
}

const readManifest = (): Manifest => JSON.parse(readFileSync(join(ASSET_ROOT, 'manifest.json'), 'utf8')) as Manifest

export const supportedMcpSharedProfiles = (): readonly string[] => Object.keys(readManifest().profiles).sort()

export const prepareMcpSharedCode = ({
  root,
  profile,
  mode,
  writes
}: {
  readonly root: string
  readonly profile: unknown
  readonly mode: 'audit' | 'conform' | 'educate'
  readonly writes: Map<string, ConformWrite>
}): McpSharedCodeContext => {
  const manifest = readManifest()
  if (manifest.contract !== 1 || manifest.owner !== OWNER) throw new Error('Invalid ki-repo-mcp shared-code manifest')
  const supportedProfiles = Object.keys(manifest.profiles).sort()
  const selected = typeof profile === 'string' ? manifest.profiles[profile] : undefined
  if (!selected)
    return {
      profile,
      supportedProfiles,
      files: [],
      missingRequirements: [],
      obsoleteManagedFiles: [],
      localExtensions: []
    }

  const expectedDestinations = new Set(selected.files.map((file) => file.destination))
  const files = selected.files.map((file): McpManagedFileEvidence => {
    const sourcePath = resolve(ASSET_ROOT, file.source)
    const destinationPath = resolve(root, file.destination)
    if (!contained(ASSET_ROOT, sourcePath) || !contained(root, destinationPath))
      return { destination: file.destination, sha256: file.sha256, state: 'asset-invalid' }
    const sourceKind = nodeKind(sourcePath)
    if (sourceKind !== 'file') return { destination: file.destination, sha256: file.sha256, state: 'asset-invalid' }
    const source = readFileSync(sourcePath, 'utf8')
    if (digest(source) !== file.sha256)
      return { destination: file.destination, sha256: file.sha256, state: 'asset-invalid' }
    const destinationKind = nodeKind(destinationPath)
    if (destinationKind === 'missing') return { destination: file.destination, sha256: file.sha256, state: 'missing' }
    if (destinationKind !== 'file') return { destination: file.destination, sha256: file.sha256, state: 'unsafe' }
    return {
      destination: file.destination,
      sha256: file.sha256,
      state: digest(readFileSync(destinationPath, 'utf8')) === file.sha256 ? 'exact' : 'modified'
    }
  })
  const missingRequirements = selected.requires.filter((path) => nodeKind(resolve(root, path)) !== 'file')
  const obsoleteManagedFiles: string[] = []
  const localExtensions: string[] = []
  const utilitiesPath = resolve(root, 'src/utils')
  if (nodeKind(utilitiesPath) === 'directory')
    for (const entry of readdirSync(utilitiesPath, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
      const destination = `src/utils/${entry.name}`
      if (expectedDestinations.has(destination)) continue
      const content = readFileSync(join(utilitiesPath, entry.name), 'utf8')
      if (MANAGED_MARKER.test(content)) obsoleteManagedFiles.push(destination)
      else localExtensions.push(destination)
    }

  const safeToConform =
    mode === 'conform' &&
    missingRequirements.length === 0 &&
    obsoleteManagedFiles.length === 0 &&
    files.every((file) => file.state === 'exact' || file.state === 'missing') &&
    selected.files.every((file) => nodeKind(resolve(root, dirname(file.destination))) === 'directory')

  return {
    profile,
    supportedProfiles,
    files,
    missingRequirements,
    obsoleteManagedFiles,
    localExtensions,
    ...(safeToConform
      ? {
          conformMissing: () => {
            for (const file of selected.files) {
              const evidence = files.find((candidate) => candidate.destination === file.destination)
              if (evidence?.state !== 'missing') continue
              const content = readFileSync(resolve(ASSET_ROOT, file.source), 'utf8')
              writes.set(file.destination, { path: file.destination, content })
            }
          }
        }
      : {})
  }
}
