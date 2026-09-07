import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import {
  configDirectory,
  isExactSiteOutput,
  type WebsiteCloudflareContext,
  type WebsiteCloudflareRubricContext
} from '../contexts/website-cloudflare.ts'

const SOURCE = 'standards-cloudflare-hosting.md'
const DIAGNOSTIC = {
  class: 'diagnostic' as const,
  guidance:
    'Correct the evidenced Cloudflare hosting issue through the responsible site owner; hosted conform does not infer deployment or security intent.'
}
const judgment = (prompt: string) => ({
  scope: 'The Cloudflare Worker, static assets, deployment configuration, and evidence named by this criterion.',
  prompt,
  outcomes: ['conforming', 'gap', 'exclusion'] as const,
  guidance:
    'Revise the hosting design through the responsible site owner, record a named gap, or record an explicit justified exclusion.'
})

const skipped = (context: WebsiteCloudflareContext): readonly AuditOutcome[] | null => (context.applicable ? null : [])

const firstSite = (context: WebsiteCloudflareContext) => context.siteConfigs[0]

const WCF_1: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-1',
  title: 'site Worker config',
  description: 'A site Worker configuration with static assets exists.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.targetExists) return [{ status: 'VIOLATION', message: 'Target directory is unavailable.' }]
        if (!context.applicable)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'No Wrangler configuration or opt-in table was found; this repository is not Cloudflare-hosted.'
            }
          ]
        const unsafe = context.configs.filter((config) => config.state === 'unsafe')
        if (context.siteConfigs.length === 0)
          return [
            {
              status: 'VIOLATION',
              message:
                unsafe.length > 0
                  ? `No safely inspectable site Worker config was found; unsafe path(s): ${unsafe.map((config) => config.path).join(', ')}.`
                  : 'No site Worker config with an assets block was found.'
            }
          ]
        return [{ status: 'PASS', message: `Site Worker config is present at ${context.siteConfigs[0].path}.` }]
      }
    }
  }
}

const WCF_2: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-2',
  title: 'Workers deploy',
  description: 'Deployment uses Workers Static Assets and contains no legacy Pages marker or Pages deploy command.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (
          context.package.state === 'unsafe' ||
          context.package.state === 'malformed' ||
          context.rootPackage.state === 'unsafe' ||
          context.rootPackage.state === 'malformed'
        )
          return [{ status: 'VIOLATION', message: 'package.json scripts could not be safely inspected.' }]
        const legacyConfigs = context.configs.filter((config) => config.hasPagesBuildOutputDir)
        const pagesScripts = [context.package, context.rootPackage].flatMap((manifest) =>
          Object.entries(manifest.scripts)
            .filter(([, script]) => /\bwrangler\s+pages\s+deploy\b/.test(script))
            .map(([name]) => ({ name, path: manifest.path }))
        )
        const results: AuditOutcome[] = legacyConfigs.map((config) => ({
          status: 'VIOLATION',
          message:
            'pages_build_output_dir is the legacy Cloudflare Pages marker. Remove it and use "assets": { "directory": "./dist" } for Workers Static Assets.',
          subject: config.path
        }))
        results.push(
          ...pagesScripts.map(({ name, path }) => ({
            status: 'VIOLATION' as const,
            message: `Pages deployment remains in script ${name}; replace wrangler pages deploy with wrangler deploy.`,
            subject: path
          }))
        )
        return results.length > 0
          ? results
          : [{ status: 'PASS', message: 'No legacy Pages marker or Pages deploy command remains.' }]
      }
    }
  }
}

const WCF_3: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-3',
  title: 'single site Worker',
  description: 'Exactly one site Worker carries an assets block.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip || context.siteConfigs.length === 0) return skip ?? []
        return context.siteConfigs.length === 1
          ? [{ status: 'PASS', message: `Exactly one site Worker config was found at ${context.siteConfigs[0].path}.` }]
          : [
              {
                status: 'VIOLATION',
                message: `More than one config carries an assets block: ${context.siteConfigs.map((config) => config.path).join(', ')}.`
              }
            ]
      }
    }
  }
}

const WCF_4: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-4',
  title: 'assets directory',
  description: 'Parsed assets.directory is the exact contained dist output adjacent to its Wrangler config.',
  sources: [`${SOURCE}#2-the-dist-seam`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const site = firstSite(context)
        if (!site) return []
        if (!site.assetsDirectory)
          return [{ status: 'VIOLATION', message: 'The assets block has no directory.', subject: site.path }]
        return isExactSiteOutput(site)
          ? [
              {
                status: 'PASS',
                message: `assets.directory consumes the exact local dist seam (${site.assetsDirectory}).`,
                subject: site.path
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message: `assets.directory ${site.assetsDirectory} is not the exact contained local dist seam.`,
                subject: site.path
              }
            ]
      }
    }
  },
  judgment: judgment(
    'Confirm the declared dist path is the exact output directory produced by the separately audited generator-neutral website build.'
  )
}

const WCF_23: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-23',
  title: 'assets-only Worker',
  description: 'A static website Worker has no main field and therefore executes no server-side code.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const sitesWithMain = context.siteConfigs.filter((config) => config.hasMain)
        return sitesWithMain.length === 0
          ? [
              {
                status: 'PASS',
                message: 'The assets-only Worker has no main field, so published requests execute no server-side code.'
              }
            ]
          : sitesWithMain.map((config) => ({
              status: 'VIOLATION' as const,
              message:
                'Static site config has a main field. Remove main so this remains an assets-only Worker with no server-side execution; otherwise it cannot claim that the published deployment has no control plane.',
              subject: config.path
            }))
      }
    }
  }
}

const WCF_24: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-24',
  title: 'SPA fallback',
  description: 'An interactive app uses Workers Static Assets single-page-application fallback.',
  sources: [`${SOURCE}#3-the-site-wranglerjsonc-shape`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (!context.configuration.appDeclared)
          return [{ status: 'PASS', message: 'The repository does not select the interactive app implementation.' }]
        const site = firstSite(context)
        if (!site) return []
        return site.notFoundHandling === 'single-page-application'
          ? [
              {
                status: 'PASS',
                message: 'assets.not_found_handling is single-page-application.',
                subject: site.path
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message:
                  'Interactive app hosting must set assets.not_found_handling to "single-page-application" so client-side routes resolve to index.html.',
                subject: site.path
              }
            ]
      }
    }
  }
}

const WCF_26: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-26',
  title: 'the Cloudflare guide',
  description:
    'A tracked guide at docs/guides/cloudflare.md records the dashboard-owned settings — Workers Builds commands, domains, redirects — that wrangler.jsonc cannot express.',
  sources: [`${SOURCE}#6-the-cloudflare-guide--dashboard-owned-settings`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const { guide } = context
        return guide.state === 'present' && guide.text.trim().length > 0
          ? [
              {
                status: 'PASS',
                message: 'The Cloudflare guide is tracked, ready to carry the dashboard-owned settings.',
                subject: guide.path
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message:
                  guide.state === 'missing'
                    ? 'No docs/guides/cloudflare.md — the dashboard-owned settings (Workers Builds commands, domains, redirects) have no reconstructable record in the repository.'
                    : 'docs/guides/cloudflare.md exists but is empty or unreadable; it must record the dashboard-owned settings.',
                subject: guide.path
              }
            ]
      }
    }
  },
  judgment: judgment(
    'Confirm the guide records the exact dashboard-owned values — Workers Builds build/deploy commands and root directory, domain and redirect choices, workers.dev — matching the live dashboard, and duplicates nothing wrangler.jsonc already declares.'
  )
}

const WCF_6: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-6',
  title: 'generated directories ignored',
  description: 'dist and .wrangler are gitignored.',
  sources: [`${SOURCE}#2-the-dist-seam`, `${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (context.gitignore.state === 'unsafe')
          return [
            { status: 'VIOLATION', message: '.gitignore is not a safely readable regular file.', subject: '.gitignore' }
          ]
        const distIgnored = /^\s*\/?(?:[^#\s]+\/)?dist\/?\s*$/m.test(context.gitignore.text)
        const wranglerIgnored = /^\s*\/?(?:[^#\s]+\/)?\.wrangler\/?\s*$/m.test(context.gitignore.text)
        return [
          {
            status: distIgnored ? 'PASS' : 'VIOLATION',
            message: distIgnored ? 'A dist directory is gitignored.' : 'No dist directory is gitignored.',
            subject: '.gitignore'
          },
          {
            status: wranglerIgnored ? 'PASS' : 'VIOLATION',
            message: wranglerIgnored ? 'A .wrangler directory is gitignored.' : 'No .wrangler directory is gitignored.',
            subject: '.gitignore'
          }
        ]
      }
    }
  }
}

const WCF_8: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-8',
  title: 'Worker identity',
  description: 'name and compatibility date are present.',
  sources: [`${SOURCE}#3-the-site-wranglerjsonc-shape`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const site = firstSite(context)
        if (!site) return []
        return [
          {
            status: site.hasName ? 'PASS' : 'VIOLATION',
            message: site.hasName ? 'Worker name is present.' : 'Worker name is absent.',
            subject: site.path
          },
          {
            status: site.hasCompatibilityDate ? 'PASS' : 'VIOLATION',
            message: site.hasCompatibilityDate
              ? 'compatibility_date is pinned.'
              : 'compatibility_date is not pinned as YYYY-MM-DD.',
            subject: site.path
          }
        ]
      }
    }
  }
}

const WCF_9: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-9',
  title: 'observability',
  description: 'observability.enabled is true.',
  sources: [`${SOURCE}#3-the-site-wranglerjsonc-shape`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const site = firstSite(context)
        if (!site) return []
        return [
          {
            status: site.observabilityEnabled ? 'PASS' : 'VIOLATION',
            message: site.observabilityEnabled
              ? 'observability.enabled is true.'
              : 'observability.enabled is not true.',
            subject: site.path
          }
        ]
      }
    }
  }
}

const WCF_10: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-10',
  title: 'optional custom-domain routes',
  description: 'When a custom domain is declared, at least one route uses custom_domain.',
  sources: [`${SOURCE}#3-the-site-wranglerjsonc-shape`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const site = firstSite(context)
        if (!site) return []
        return [
          {
            status: site.hasCustomDomain ? 'PASS' : 'NOT_APPLICABLE',
            message: site.hasCustomDomain
              ? 'At least one route uses custom_domain.'
              : 'No custom-domain route is declared; workers.dev-only hosting is valid.',
            subject: site.path
          }
        ]
      }
    }
  },
  judgment: judgment(
    'When custom-domain routes are declared, verify they name the intended apex and any www host; workers.dev-only hosting needs no exception.'
  )
}

const expectedRootAlias = (context: WebsiteCloudflareContext, localScript: string): string =>
  context.configuration.siteRoot === '.'
    ? `bun run ${localScript}`
    : `bun run --cwd ${context.configuration.siteRoot} ${localScript}`

const WCF_13: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-13',
  title: 'deploy script',
  description: 'The selected site package deploys with Wrangler and the repository root delegates the public alias.',
  sources: [`${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (
          context.package.state === 'unsafe' ||
          context.package.state === 'malformed' ||
          context.rootPackage.state === 'unsafe' ||
          context.rootPackage.state === 'malformed'
        )
          return [
            {
              status: 'VIOLATION',
              message: 'package.json scripts could not be safely inspected.',
              subject: context.package.path
            }
          ]
        const local = context.package.scripts.deploy
        const alias = context.rootPackage.scripts['ki:site:deploy']
        const expectedAlias = expectedRootAlias(context, 'deploy')
        return [
          local && /\bwrangler\s+deploy\b/.test(local)
            ? {
                status: 'PASS',
                message: 'The local deploy script runs wrangler deploy.',
                subject: context.package.path
              }
            : {
                status: 'VIOLATION',
                message: 'The selected site package must expose a local deploy script that runs wrangler deploy.',
                subject: context.package.path
              },
          alias === expectedAlias
            ? {
                status: 'PASS',
                message: 'The public ki:site:deploy alias delegates to the selected site package.',
                subject: context.rootPackage.path
              }
            : {
                status: 'VIOLATION',
                message: `ki:site:deploy must be exactly "${expectedAlias}".`,
                subject: context.rootPackage.path
              }
        ]
      }
    }
  },
  judgment: judgment(
    'Confirm the real deployment path builds a current dist before invoking wrangler deploy; do not execute deployment during audit or conform.'
  )
}

const WCF_14: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-14',
  title: 'preview script',
  description: 'The selected site package previews with Wrangler and the repository root delegates the public alias.',
  sources: [`${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (
          context.package.state === 'unsafe' ||
          context.package.state === 'malformed' ||
          context.rootPackage.state === 'unsafe' ||
          context.rootPackage.state === 'malformed'
        )
          return [
            {
              status: 'VIOLATION',
              message: 'package.json scripts could not be safely inspected.',
              subject: context.package.path
            }
          ]
        const local = context.package.scripts.preview
        const alias = context.rootPackage.scripts['ki:site:preview']
        const expectedAlias = expectedRootAlias(context, 'preview')
        return [
          local && /\bwrangler\s+dev\b/.test(local)
            ? { status: 'PASS', message: 'The local preview script runs wrangler dev.', subject: context.package.path }
            : {
                status: 'VIOLATION',
                message: 'The selected site package must expose a local preview script that runs wrangler dev.',
                subject: context.package.path
              },
          alias === expectedAlias
            ? {
                status: 'PASS',
                message: 'The public ki:site:preview alias delegates to the selected site package.',
                subject: context.rootPackage.path
              }
            : {
                status: 'VIOLATION',
                message: `ki:site:preview must be exactly "${expectedAlias}".`,
                subject: context.rootPackage.path
              }
        ]
      }
    }
  },
  judgment: judgment(
    'Verify the preview script builds the site before wrangler dev and serves the same dist seam as production.'
  )
}

const WCF_25: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-25',
  title: 'version-upload authority',
  description:
    'An optional local upload script and its public alias create an undeployed Worker version only through explicit remote-effect authority.',
  sources: [`${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'FAIL',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (
          context.package.state === 'unsafe' ||
          context.package.state === 'malformed' ||
          context.rootPackage.state === 'unsafe' ||
          context.rootPackage.state === 'malformed'
        )
          return [
            {
              status: 'VIOLATION',
              message: 'package.json scripts could not be safely inspected.',
              subject: context.package.path
            }
          ]
        const upload = context.package.scripts.upload
        const alias = context.rootPackage.scripts['ki:site:upload']
        if (!upload && !alias)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'No optional site upload operation is declared.',
              subject: context.package.path
            }
          ]
        const expectedUpload = 'bunx wrangler versions upload'
        const expectedAlias = expectedRootAlias(context, 'upload')
        return [
          upload === expectedUpload
            ? {
                status: 'PASS',
                message:
                  'The local upload script creates an undeployed Worker version; only an explicitly authorised operator or Workers Builds service may run this credentialed remote mutation.',
                subject: context.package.path
              }
            : {
                status: 'VIOLATION',
                message: `The local upload script must be exactly "${expectedUpload}".`,
                subject: context.package.path
              },
          alias === expectedAlias
            ? {
                status: 'PASS',
                message: 'The public ki:site:upload alias delegates to the selected site package.',
                subject: context.rootPackage.path
              }
            : {
                status: 'VIOLATION',
                message: `ki:site:upload must be exactly "${expectedAlias}".`,
                subject: context.rootPackage.path
              }
        ]
      }
    }
  },
  judgment: judgment(
    'Confirm audits, conformance, local builds, tests, and dry evaluation inspect ki:site:upload without executing Wrangler; only an explicitly authorised operator or Workers Builds service may supply Cloudflare credentials and create the remote version.'
  )
}

const WCF_19: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-19',
  title: 'companion Worker boundary',
  description: 'Companion Workers remain out of scope.',
  sources: [`${SOURCE}#7-boundaries--what-is-not-in-scope`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        return context.companionConfigs.length === 0
          ? [{ status: 'PASS', message: 'No companion Worker configs were discovered.' }]
          : [
              {
                status: 'INFO',
                message: `Companion Workers were left out of scope: ${context.companionConfigs.map((config) => config.path).join(', ')}.`
              }
            ]
      }
    }
  },
  judgment: judgment(
    'Confirm configs classified as companions have main without assets and route their bindings, secrets, and runtime concerns to cloudflare/wrangler.'
  )
}

const WCF_20: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-20',
  title: 'hosting opt-in',
  description: 'The Cloudflare opt-in table is present.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const state = context.configuration.state
        return state === 'present'
          ? [
              {
                status: 'PASS',
                message: 'The [skills.ki-repo-website-cloudflare] table is present.',
                subject: '.ki.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message:
                  state === 'unsafe'
                    ? '.ki.toml is not a safely readable regular file.'
                    : state === 'malformed'
                      ? '.ki.toml is malformed.'
                      : 'The [skills.ki-repo-website-cloudflare] table is absent.',
                subject: '.ki.toml'
              }
            ]
      }
    }
  }
}

const WCF_21: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-21',
  title: 'opt-in validation',
  description: 'The hosting table is keyless and consumes the valid website-core site root.',
  sources: [`${SOURCE}#1-model--workers-static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip || context.configuration.state !== 'present') return skip ?? []
        const outcomes: AuditOutcome[] = context.configuration.keys.map((key) => ({
          status: 'VIOLATION',
          message: `Unknown opt-in key: ${key}.`,
          subject: '.ki.toml'
        }))
        if (!context.configuration.siteRootValid)
          outcomes.push({
            status: 'VIOLATION',
            message: 'The [skills.ki-repo-website] site-root is missing or invalid.',
            subject: '.ki.toml'
          })
        else {
          const siteRoot = context.configuration.siteRoot
          const normalised = siteRoot.replace(/^\.\//, '').replace(/\/$/, '') || '.'
          const directories = new Set(context.configs.map(configDirectory))
          outcomes.push({
            status: directories.has(normalised) ? 'PASS' : 'VIOLATION',
            message: directories.has(normalised)
              ? `The website-core site root ${siteRoot} holds a Wrangler config.`
              : `The website-core site root ${siteRoot} holds no Wrangler config.`,
            subject: '.ki.toml'
          })
        }
        return outcomes
      }
    }
  }
}

const WCF_22: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-22',
  title: 'hosting delta',
  description: 'This remains the hosting delta only.',
  sources: [`${SOURCE}#7-boundaries--what-is-not-in-scope`],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC,
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        return [
          {
            status: 'INFO',
            message:
              'Run ki-repo-website and the selected content or app implementation audit separately; Cloudflare account, domain, Wrangler, and deployment operations remain explicit report-only work.'
          }
        ]
      }
    }
  },
  judgment: judgment(
    'Confirm Workers Builds, account/domain binding, and deployed behavior separately without expanding this rubric into the site build or general Worker concerns.'
  )
}

export const WCF: RubricFamily<WebsiteCloudflareRubricContext, WebsiteCloudflareContext> = {
  code: 'WCF',
  title: 'Cloudflare hosting',
  description: 'Workers Static Assets hosting standard.',
  standard: SOURCE,
  selectContext: (context) => context.hosting,
  items: [
    WCF_1,
    WCF_2,
    WCF_3,
    WCF_4,
    WCF_6,
    WCF_8,
    WCF_9,
    WCF_10,
    WCF_13,
    WCF_14,
    WCF_25,
    WCF_26,
    WCF_19,
    WCF_20,
    WCF_21,
    WCF_22,
    WCF_23,
    WCF_24
  ]
}
