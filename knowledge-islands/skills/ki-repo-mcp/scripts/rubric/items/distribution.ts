import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { isSemVer } from '../contexts/distribution.ts'
import type { McpDistributionContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-distribution.md'

const DIST_1: RubricItem<McpDistributionContext> = {
  code: 'DIST-1',
  title: 'Source-release readiness',
  description:
    'The repository distinguishes valid development source from annotated release evidence while warning on invalid or malformed source-release evidence.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Development-only INFO needs no repair. Repair invalid package, build, lockfile, repository, or HEAD evidence, but leave versions, tags, releases, repository identity, and workflow changes to the repository owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const outcomes: AuditOutcome[] = []
        const version = typeof context.packageJson?.version === 'string' ? context.packageJson.version : undefined
        const hasValidVersion = Boolean(version && isSemVer(version))
        const scripts =
          context.packageJson?.scripts && typeof context.packageJson.scripts === 'object'
            ? (context.packageJson.scripts as Record<string, unknown>)
            : {}
        const hasBuildScript = typeof scripts.build === 'string' && Boolean(scripts.build.trim())
        const hasTrackedLockfile = context.lockfile?.tracked === true
        const hasRepositoryIdentity = Boolean(context.repositoryIdentity)
        const hasHeadCommit = Boolean(context.headCommit)
        outcomes.push(
          hasValidVersion
            ? {
                status: 'PASS',
                message: `Package version ${version} is valid Semantic Versioning.`,
                subject: 'package.json'
              }
            : {
                status: 'VIOLATION',
                message: 'package.json requires a valid Semantic Versioning version for source release.',
                subject: 'package.json'
              }
        )
        outcomes.push(
          hasBuildScript
            ? { status: 'PASS', message: 'A governed build script is declared.', subject: 'package.json' }
            : { status: 'VIOLATION', message: 'package.json has no governed build script.', subject: 'package.json' }
        )
        outcomes.push(
          hasTrackedLockfile
            ? {
                status: 'PASS',
                message: `${context.lockfile.path} is a committed regular lockfile.`,
                subject: context.lockfile.path
              }
            : {
                status: 'VIOLATION',
                message: context.lockfile
                  ? `${context.lockfile.path} is not committed or is unsafe.`
                  : 'No regular Bun lockfile is available.',
                subject: context.lockfile?.path ?? 'bun.lock'
              }
        )
        outcomes.push(
          hasRepositoryIdentity
            ? {
                status: 'PASS',
                message: `Git origin supplies install identity ${context.repositoryIdentity}.`,
                subject: '.git/config'
              }
            : {
                status: 'VIOLATION',
                message: 'Git origin does not supply a supported GitHub owner/repository identity.',
                subject: '.git/config'
              }
        )
        outcomes.push(
          hasHeadCommit
            ? { status: 'PASS', message: `HEAD resolves to immutable commit ${context.headCommit}.`, subject: 'HEAD' }
            : { status: 'VIOLATION', message: 'HEAD does not resolve to a full commit ID.', subject: 'HEAD' }
        )
        const expectedTag = hasValidVersion ? `v${version}` : undefined
        const hasAnnotatedReleaseTag = expectedTag && context.releaseTag === expectedTag && context.releaseTagAnnotated
        const isValidDevelopmentHead =
          expectedTag &&
          hasBuildScript &&
          hasTrackedLockfile &&
          hasRepositoryIdentity &&
          hasHeadCommit &&
          context.releaseTag === null
        outcomes.push(
          hasAnnotatedReleaseTag
            ? {
                status: 'PASS',
                message: `HEAD carries annotated release tag ${expectedTag}.`,
                subject: `refs/tags/${expectedTag}`
              }
            : isValidDevelopmentHead
              ? {
                  status: 'INFO',
                  message: `HEAD is valid development source without release tag ${expectedTag}; release readiness still requires the matching annotated tag.`,
                  subject: `refs/tags/${expectedTag}`
                }
              : {
                  status: 'VIOLATION',
                  message: expectedTag
                    ? `HEAD is not the annotated release tag ${expectedTag}; development checkout is not installable release evidence.`
                    : 'A release tag cannot be derived until package.json has a valid version.',
                  subject: expectedTag ? `refs/tags/${expectedTag}` : 'package.json'
                }
        )
        return outcomes
      }
    }
  },
  judgment: {
    scope:
      'Repository release settings, source accessibility, stable-release marker, and installer provenance receipt.',
    prompt:
      'Verify public and private source access without changing visibility, ensure omitted versions resolve only the owner-designated latest stable release, and compare the installer receipt with the selected tag and commit.',
    outcomes: ['ready', 'development-only', 'provenance-mismatch', 'exclusion'],
    guidance:
      'The owner cuts or designates releases; CONFORM must not mint versions or tags, publish a release, change repository identity, or rewrite workflows.'
  }
}

export const DIST: RubricFamily<McpRubricContext, McpDistributionContext> = {
  code: 'DIST',
  title: 'MCP source distribution',
  description: 'Versioned source releases provide immutable build and provenance evidence without package publication.',
  standard: STANDARD,
  selectContext: (context) => context.distribution,
  items: [DIST_1]
}
