const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

const COMMIT = /^[0-9a-f]{40}$/

export type SourceInstallReceipt = {
  readonly schemaVersion: number
  readonly repository: string
  readonly tag: string
  readonly commit: string
  readonly packageVersion: string
  readonly entryPoint: string
  readonly installedAt: string
  readonly active: boolean
}

export type SourceInstallCandidate = {
  readonly requestedRepository: string
  readonly requestedVersion?: string
  readonly stableReleaseTag?: string
  readonly origin: string
  readonly visibility: 'public' | 'private'
  readonly sourceAccessible: boolean
  readonly selectedRef: { readonly kind: 'tag' | 'branch' | 'commit'; readonly name: string }
  readonly selectedCommit: string
  readonly tagCommit?: string
  readonly packageVersion: string
  readonly entryPoint: string
  readonly hasBuildScript: boolean
  readonly hasTrackedLockfile: boolean
  readonly receipt?: SourceInstallReceipt
}

export type SourceInstallAssessment = {
  readonly ok: boolean
  readonly repository?: string
  readonly version?: string
  readonly tag?: string
  readonly commit?: string
  readonly problems: readonly string[]
}

export const isSemVer = (value: string): boolean => SEMVER.test(value)

export const normalizeGitHubRepository = (value: string): string | undefined => {
  const trimmed = value.trim().replace(/\.git$/, '')
  const match =
    trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#]+)$/i) ??
    trimmed.match(/^git@github\.com:([^/]+)\/([^/#]+)$/i) ??
    trimmed.match(/^ssh:\/\/git@github\.com\/([^/]+)\/([^/#]+)$/i)
  if (!match?.[1] || !match[2]) return undefined
  return `${match[1]}/${match[2]}`.toLowerCase()
}

const versionFromTag = (tag: string | undefined): string | undefined => {
  if (!tag?.startsWith('v')) return undefined
  const version = tag.slice(1)
  return isSemVer(version) ? version : undefined
}

export const assessSourceInstallCandidate = (candidate: SourceInstallCandidate): SourceInstallAssessment => {
  const problems: string[] = []
  const repository = normalizeGitHubRepository(candidate.origin)
  const requestedRepository = candidate.requestedRepository.toLowerCase()
  if (!candidate.sourceAccessible)
    problems.push(`${candidate.visibility} source is not accessible with local Git credentials.`)
  if (!repository) problems.push('Origin is not a supported GitHub repository URL.')
  else if (repository !== requestedRepository)
    problems.push(`Origin identity ${repository} does not match requested repository ${requestedRepository}.`)

  let version: string | undefined
  let tag: string | undefined
  if (candidate.requestedVersion !== undefined) {
    if (!isSemVer(candidate.requestedVersion)) problems.push('Requested version is not valid Semantic Versioning.')
    else {
      version = candidate.requestedVersion
      tag = `v${version}`
    }
  } else {
    version = versionFromTag(candidate.stableReleaseTag)
    tag = candidate.stableReleaseTag
    if (!version) problems.push('An omitted version requires an owner-designated stable v<SemVer> release tag.')
    else if (version.includes('-')) problems.push('The owner-designated stable release tag must not be a prerelease.')
  }

  if (candidate.selectedRef.kind !== 'tag')
    problems.push('Installation must resolve a tag, not a mutable branch or bare commit.')
  if (tag && candidate.selectedRef.name !== tag)
    problems.push(`Selected ref ${candidate.selectedRef.name} does not match required release tag ${tag}.`)
  if (!COMMIT.test(candidate.selectedCommit)) problems.push('Selected commit is not a full immutable Git object ID.')
  if (!candidate.tagCommit || candidate.tagCommit !== candidate.selectedCommit)
    problems.push('Release tag does not resolve to the selected immutable commit.')
  if (version && candidate.packageVersion !== version)
    problems.push(`package.json version ${candidate.packageVersion} does not match release version ${version}.`)
  if (!candidate.hasBuildScript) problems.push('package.json has no governed build script.')
  if (!candidate.hasTrackedLockfile) problems.push('No committed Bun lockfile is available for the build.')
  if (candidate.entryPoint !== 'dist/mcp-server/index.js')
    problems.push('The declared MCP entry point is not dist/mcp-server/index.js.')

  if (candidate.receipt && tag && version) {
    const expected: SourceInstallReceipt = {
      schemaVersion: candidate.receipt.schemaVersion,
      repository: requestedRepository,
      tag,
      commit: candidate.selectedCommit,
      packageVersion: version,
      entryPoint: candidate.entryPoint,
      installedAt: candidate.receipt.installedAt,
      active: candidate.receipt.active
    }
    if (
      !Number.isSafeInteger(candidate.receipt.schemaVersion) ||
      candidate.receipt.schemaVersion < 1 ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(candidate.receipt.installedAt) ||
      candidate.receipt.repository.toLowerCase() !== expected.repository ||
      candidate.receipt.tag !== expected.tag ||
      candidate.receipt.commit !== expected.commit ||
      candidate.receipt.packageVersion !== expected.packageVersion ||
      candidate.receipt.entryPoint !== expected.entryPoint
    )
      problems.push('Recorded provenance does not match the selected source release.')
  }

  return {
    ok: problems.length === 0,
    ...(repository ? { repository } : {}),
    ...(version ? { version } : {}),
    ...(tag ? { tag } : {}),
    ...(COMMIT.test(candidate.selectedCommit) ? { commit: candidate.selectedCommit } : {}),
    problems
  }
}
