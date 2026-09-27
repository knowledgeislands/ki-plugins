import { createHash } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type { ConformCommand, ConformWrite } from '../../shared/rubric.ts'

const OWNER = 'ki-repo-tools'
const ASSET_ROOT = resolve(import.meta.dir, '../../../assets/shared-code')
const MANAGED_MARKER = /^# @ki-managed ki-repo-tools profile=([^\s]+) template=([0-9a-f]{64})$/m

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'
type ManagedFileState = 'exact' | 'missing' | 'modified' | 'non-executable' | 'unsafe' | 'asset-invalid'

type ManifestFile = {
  readonly source: string
  readonly destination: string
  readonly sha256: string
  readonly executable: boolean
}

type ManifestProfile = {
  readonly required_params: readonly string[]
  readonly files: readonly ManifestFile[]
}

type Manifest = {
  readonly contract: number
  readonly owner: string
  readonly profiles: Readonly<Record<string, ManifestProfile>>
}

export type ToolManagedFileEvidence = {
  readonly destination: string
  readonly renderedSha256: string | null
  readonly state: ManagedFileState
}

export type ToolSharedCodeContext = {
  readonly profile: unknown
  readonly supportedProfiles: readonly string[]
  readonly files: readonly ToolManagedFileEvidence[]
  readonly invalidParameters: readonly string[]
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
const executable = (path: string): boolean => (lstatSync(path).mode & 0o111) !== 0

const contained = (root: string, path: string): boolean => {
  const value = relative(root, path)
  return value !== '' && !isAbsolute(value) && value !== '..' && !value.startsWith('../')
}

const readManifest = (): Manifest => JSON.parse(readFileSync(join(ASSET_ROOT, 'manifest.json'), 'utf8')) as Manifest

export const supportedToolSharedProfiles = (): readonly string[] => Object.keys(readManifest().profiles).sort()

export const toolSharedProfileParameters = (profile: string): readonly string[] =>
  readManifest().profiles[profile]?.required_params ?? []

const safePath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  !isAbsolute(value) &&
  !value.split('/').includes('..') &&
  /^[A-Za-z0-9._/-]+$/.test(value)

const validateParameters = (
  profile: ManifestProfile,
  parameters: Readonly<Record<string, unknown>>
): readonly string[] => {
  const invalid = profile.required_params.filter((key) => parameters[key] === undefined)
  invalid.push(...Object.keys(parameters).filter((key) => key !== 'profile' && !profile.required_params.includes(key)))
  if (typeof parameters.tool !== 'string' || !/^[a-z][a-z0-9-]*$/.test(parameters.tool)) invalid.push('tool')
  if (typeof parameters.repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(parameters.repository))
    invalid.push('repository')
  if (typeof parameters.env_prefix !== 'string' || !/^[A-Z][A-Z0-9_]*$/.test(parameters.env_prefix))
    invalid.push('env_prefix')
  if (!safePath(parameters.manual_path)) invalid.push('manual_path')
  if (parameters.public_key_path !== undefined && !safePath(parameters.public_key_path)) invalid.push('public_key_path')
  return [...new Set(invalid)].sort()
}

const render = ({
  source,
  profile,
  templateSha256,
  parameters,
  publicKey
}: {
  readonly source: string
  readonly profile: string
  readonly templateSha256: string
  readonly parameters: Readonly<Record<string, unknown>>
  readonly publicKey: string
}): string => {
  const replacements: Readonly<Record<string, string>> = {
    TOOL: String(parameters.tool),
    REPOSITORY: String(parameters.repository),
    ENV_PREFIX: String(parameters.env_prefix),
    MANUAL_PATH: String(parameters.manual_path),
    PROFILE: profile,
    TEMPLATE_SHA256: templateSha256,
    PUBLIC_KEY_PEM: publicKey.trimEnd()
  }
  let rendered = source
  for (const [key, value] of Object.entries(replacements)) rendered = rendered.replaceAll(`{{${key}}}`, value)
  if (/\{\{[A-Z0-9_]+\}\}/.test(rendered)) throw new Error('Unresolved ki-repo-tools template token')
  return rendered
}

export const prepareToolSharedCode = ({
  root,
  profile,
  parameters,
  mode,
  writes,
  commands
}: {
  readonly root: string
  readonly profile: unknown
  readonly parameters: Readonly<Record<string, unknown>>
  readonly mode: 'audit' | 'conform' | 'educate'
  readonly writes: Map<string, ConformWrite>
  readonly commands: Map<string, ConformCommand>
}): ToolSharedCodeContext => {
  const manifest = readManifest()
  if (manifest.contract !== 1 || manifest.owner !== OWNER) throw new Error('Invalid ki-repo-tools shared-code manifest')
  const supportedProfiles = Object.keys(manifest.profiles).sort()
  const selected = typeof profile === 'string' ? manifest.profiles[profile] : undefined
  if (!selected)
    return {
      profile,
      supportedProfiles,
      files: [],
      invalidParameters: [],
      obsoleteManagedFiles: [],
      localExtensions: []
    }

  const invalidParameters = [...validateParameters(selected, parameters)]
  if (typeof parameters.tool === 'string' && nodeKind(resolve(root, 'bin', parameters.tool)) !== 'file')
    invalidParameters.push('tool')
  if (safePath(parameters.manual_path) && nodeKind(resolve(root, parameters.manual_path)) !== 'file')
    invalidParameters.push('manual_path')
  let publicKey = ''
  if (typeof parameters.public_key_path === 'string' && safePath(parameters.public_key_path)) {
    const keyPath = resolve(root, parameters.public_key_path)
    if (contained(root, keyPath) && nodeKind(keyPath) === 'file') {
      publicKey = readFileSync(keyPath, 'utf8')
      if (!/^-----BEGIN PUBLIC KEY-----\n[\s\S]+\n-----END PUBLIC KEY-----\n?$/.test(publicKey))
        invalidParameters.push('public_key_path')
    } else invalidParameters.push('public_key_path')
  }

  const expectedDestinations = new Set(selected.files.map((file) => file.destination))
  const rendered = new Map<string, string>()
  const files = selected.files.map((file): ToolManagedFileEvidence => {
    const sourcePath = resolve(ASSET_ROOT, file.source)
    const destinationPath = resolve(root, file.destination)
    if (!contained(ASSET_ROOT, sourcePath) || !contained(root, destinationPath) || nodeKind(sourcePath) !== 'file')
      return { destination: file.destination, renderedSha256: null, state: 'asset-invalid' }
    const source = readFileSync(sourcePath, 'utf8')
    if (digest(source) !== file.sha256)
      return { destination: file.destination, renderedSha256: null, state: 'asset-invalid' }
    if (invalidParameters.length > 0)
      return { destination: file.destination, renderedSha256: null, state: 'asset-invalid' }
    const content = render({ source, profile: profile as string, templateSha256: file.sha256, parameters, publicKey })
    const renderedSha256 = digest(content)
    rendered.set(file.destination, content)
    const kind = nodeKind(destinationPath)
    if (kind === 'missing') return { destination: file.destination, renderedSha256, state: 'missing' }
    if (kind !== 'file') return { destination: file.destination, renderedSha256, state: 'unsafe' }
    if (digest(readFileSync(destinationPath, 'utf8')) !== renderedSha256)
      return { destination: file.destination, renderedSha256, state: 'modified' }
    if (file.executable && !executable(destinationPath))
      return { destination: file.destination, renderedSha256, state: 'non-executable' }
    return { destination: file.destination, renderedSha256, state: 'exact' }
  })

  const obsoleteManagedFiles: string[] = []
  const localExtensions: string[] = []
  for (const destination of ['install.sh', 'release/package.sh', 'release/package.test.sh']) {
    const path = resolve(root, destination)
    if (nodeKind(path) !== 'file' || expectedDestinations.has(destination)) continue
    const source = readFileSync(path, 'utf8')
    if (MANAGED_MARKER.test(source)) obsoleteManagedFiles.push(destination)
    else localExtensions.push(destination)
  }

  const safeToConform =
    mode === 'conform' &&
    invalidParameters.length === 0 &&
    obsoleteManagedFiles.length === 0 &&
    files.every((file) => ['exact', 'missing', 'non-executable'].includes(file.state)) &&
    selected.files.every((file) => nodeKind(resolve(root, dirname(file.destination))) === 'directory')

  return {
    profile,
    supportedProfiles,
    files,
    invalidParameters: [...new Set(invalidParameters)].sort(),
    obsoleteManagedFiles,
    localExtensions,
    ...(safeToConform
      ? {
          conformMissing: () => {
            for (const file of selected.files) {
              const evidence = files.find((candidate) => candidate.destination === file.destination)
              if (evidence?.state === 'missing') {
                const content = rendered.get(file.destination)
                if (content) writes.set(file.destination, { path: file.destination, content, create: true })
              }
              if (file.executable && (evidence?.state === 'missing' || evidence?.state === 'non-executable'))
                commands.set(file.destination, { program: 'chmod', arguments: ['+x', file.destination] })
            }
          }
        }
      : {})
  }
}
