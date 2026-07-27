import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { configDirectory, type WebsiteCloudflareContext, type WebsiteCloudflareRubricContext } from '../contexts/website-cloudflare.ts'

const SOURCE = 'standards-cloudflare-hosting.md'

const skipped = (context: WebsiteCloudflareContext): readonly AuditOutcome[] | null => (context.applicable ? null : [])

const firstSite = (context: WebsiteCloudflareContext) => context.siteConfigs[0]

const WCF_1: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-1',
  title: 'site Worker config',
  description: 'A site Worker configuration with static assets exists.',
  sources: [`${SOURCE}#1-model--workers--static-assets-not-pages`],
  mechanical: {
    level: 'FAIL',
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
  description: 'Deployment uses Workers + Static Assets, not Pages.',
  sources: [`${SOURCE}#1-model--workers--static-assets-not-pages`],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (context.package.state === 'unsafe' || context.package.state === 'malformed')
          return [{ status: 'VIOLATION', message: 'package.json scripts could not be safely inspected.' }]
        const pages = Object.entries(context.package.scripts).filter(([, script]) => /\bwrangler\s+pages\s+deploy\b/.test(script))
        return pages.length === 0
          ? [{ status: 'PASS', message: 'No package script uses wrangler pages deploy.', subject: 'package.json' }]
          : [
              {
                status: 'VIOLATION',
                message: `Pages deployment remains in script(s): ${pages.map(([name]) => name).join(', ')}.`,
                subject: 'package.json'
              }
            ]
      }
    }
  }
}

const WCF_3: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-3',
  title: 'single site Worker',
  description: 'Exactly one site Worker carries an assets block.',
  sources: [`${SOURCE}#1-model--workers--static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
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
  description: 'Assets point at the build dist directory.',
  sources: [`${SOURCE}#2-the-dist-seam`],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const site = firstSite(context)
        if (!site) return []
        if (!site.assetsDirectory) return [{ status: 'VIOLATION', message: 'The assets block has no directory.', subject: site.path }]
        return /(?:^|\/)dist\/?$/.test(site.assetsDirectory)
          ? [
              {
                status: 'PASS',
                message: `assets.directory points at dist (${site.assetsDirectory}).`,
                subject: site.path
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message: `assets.directory points at ${site.assetsDirectory}, not the build dist directory.`,
                subject: site.path
              }
            ]
      }
    }
  },
  judgment: {
    prompt: 'Confirm the declared dist path is the exact output directory produced by the separately audited ki-website build.'
  }
}

const WCF_6: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-6',
  title: 'generated directories ignored',
  description: 'dist and .wrangler are gitignored.',
  sources: [`${SOURCE}#2-the-dist-seam`, `${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (context.gitignore.state === 'unsafe')
          return [{ status: 'VIOLATION', message: '.gitignore is not a safely readable regular file.', subject: '.gitignore' }]
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
            message: site.hasCompatibilityDate ? 'compatibility_date is pinned.' : 'compatibility_date is not pinned as YYYY-MM-DD.',
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
            message: site.observabilityEnabled ? 'observability.enabled is true.' : 'observability.enabled is not true.',
            subject: site.path
          }
        ]
      }
    }
  }
}

const WCF_10: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-10',
  title: 'custom-domain routes',
  description: 'Routes use custom_domain where appropriate.',
  sources: [`${SOURCE}#3-the-site-wranglerjsonc-shape`],
  mechanical: {
    level: 'WARN',
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
            status: site.hasCustomDomain ? 'PASS' : 'VIOLATION',
            message: site.hasCustomDomain
              ? 'At least one route uses custom_domain.'
              : 'No custom_domain route was found; verify whether this site intentionally uses workers.dev.',
            subject: site.path
          }
        ]
      }
    }
  },
  judgment: {
    prompt: 'Verify the custom-domain routes name the correct apex and www host, or document the intentional workers.dev-only exception.'
  }
}

const WCF_13: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-13',
  title: 'deploy script',
  description: 'A deploy script runs wrangler deploy.',
  sources: [`${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (context.package.state === 'unsafe' || context.package.state === 'malformed')
          return [{ status: 'VIOLATION', message: 'package.json scripts could not be safely inspected.', subject: 'package.json' }]
        const named = context.package.scripts['ki:site:deploy']
          ? (['ki:site:deploy', context.package.scripts['ki:site:deploy']] as const)
          : context.package.scripts.deploy
            ? (['deploy', context.package.scripts.deploy] as const)
            : null
        return named && /\bwrangler\s+deploy\b/.test(named[1])
          ? [{ status: 'PASS', message: `The ${named[0]} script runs wrangler deploy.`, subject: 'package.json' }]
          : [{ status: 'VIOLATION', message: 'No site deploy script runs wrangler deploy.', subject: 'package.json' }]
      }
    }
  },
  judgment: {
    prompt:
      'Confirm the real deployment path builds a current dist before invoking wrangler deploy; do not execute deployment during audit or conform.'
  }
}

const WCF_14: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-14',
  title: 'preview script',
  description: 'A preview script runs wrangler dev.',
  sources: [`${SOURCE}#4-the-script-family`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        if (context.package.state === 'unsafe' || context.package.state === 'malformed')
          return [{ status: 'VIOLATION', message: 'package.json scripts could not be safely inspected.', subject: 'package.json' }]
        const preview = context.package.scripts['ki:site:preview'] ?? context.package.scripts.preview
        return preview && /\bwrangler\s+dev\b/.test(preview)
          ? [{ status: 'PASS', message: 'The site preview script runs wrangler dev.', subject: 'package.json' }]
          : [{ status: 'VIOLATION', message: 'No site preview script runs wrangler dev.', subject: 'package.json' }]
      }
    }
  },
  judgment: {
    prompt: 'Verify the preview script builds the site before wrangler dev and serves the same dist seam as production.'
  }
}

const WCF_19: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-19',
  title: 'companion Worker boundary',
  description: 'Companion Workers remain out of scope.',
  sources: [`${SOURCE}#6-boundaries--what-is-not-in-scope`],
  mechanical: {
    level: 'WARN',
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
  judgment: {
    prompt:
      'Confirm configs classified as companions have main without assets and route their bindings, secrets, and runtime concerns to cloudflare/wrangler.'
  }
}

const WCF_20: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-20',
  title: 'hosting opt-in',
  description: 'The Cloudflare opt-in table is present.',
  sources: [`${SOURCE}#1-model--workers--static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        const state = context.configuration.state
        return state === 'present'
          ? [{ status: 'PASS', message: 'The [ki-website-cloudflare] table is present.', subject: '.ki-config.toml' }]
          : [
              {
                status: 'VIOLATION',
                message:
                  state === 'unsafe'
                    ? '.ki-config.toml is not a safely readable regular file.'
                    : state === 'malformed'
                      ? '.ki-config.toml is malformed.'
                      : 'The [ki-website-cloudflare] table is absent.',
                subject: '.ki-config.toml'
              }
            ]
      }
    }
  }
}

const safeSiteRoot = (value: string): boolean =>
  value === '.' || (!value.startsWith('/') && !value.split(/[\\/]/).includes('..') && !value.includes('\\'))

const WCF_21: RubricItem<WebsiteCloudflareContext> = {
  code: 'WCF-21',
  title: 'opt-in validation',
  description: 'The opt-in site root is valid.',
  sources: [`${SOURCE}#1-model--workers--static-assets-not-pages`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip || context.configuration.state !== 'present') return skip ?? []
        const unknown = context.configuration.keys.filter((key) => key !== 'site-root')
        const outcomes: AuditOutcome[] = unknown.map((key) => ({
          status: 'VIOLATION',
          message: `Unknown opt-in key: ${key}.`,
          subject: '.ki-config.toml'
        }))
        const siteRoot = context.configuration.siteRoot
        if (context.configuration.keys.includes('site-root') && siteRoot === null)
          outcomes.push({
            status: 'VIOLATION',
            message: 'site-root must be a string.',
            subject: '.ki-config.toml'
          })
        else if (siteRoot === null)
          outcomes.push({
            status: 'PASS',
            message: 'No site-root override is declared; Wrangler config discovery applies.',
            subject: '.ki-config.toml'
          })
        else if (!safeSiteRoot(siteRoot))
          outcomes.push({
            status: 'VIOLATION',
            message: `site-root is not a safe relative path: ${siteRoot}.`,
            subject: '.ki-config.toml'
          })
        else {
          const normalised = siteRoot.replace(/^\.\//, '').replace(/\/$/, '') || '.'
          const directories = new Set(context.configs.map(configDirectory))
          outcomes.push({
            status: directories.has(normalised) ? 'PASS' : 'VIOLATION',
            message: directories.has(normalised)
              ? `The declared site-root ${siteRoot} holds a Wrangler config.`
              : `The declared site-root ${siteRoot} holds no Wrangler config.`,
            subject: '.ki-config.toml'
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
  sources: [`${SOURCE}#6-boundaries--what-is-not-in-scope`],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const skip = skipped(context)
        if (skip) return skip
        return [
          {
            status: 'INFO',
            message:
              'Run ki-engineering and ki-website audits separately; Cloudflare account, domain, Wrangler, and deployment operations remain explicit report-only work.'
          }
        ]
      }
    }
  },
  judgment: {
    prompt:
      'Confirm Workers Builds, account/domain binding, and deployed behavior separately without expanding this rubric into the site build or general Worker concerns.'
  }
}

export const WCF: RubricFamily<WebsiteCloudflareRubricContext, WebsiteCloudflareContext> = {
  code: 'WCF',
  title: 'Cloudflare hosting',
  description: 'Workers + Static Assets hosting standard.',
  standard: SOURCE,
  selectContext: (context) => context.hosting,
  items: [WCF_1, WCF_2, WCF_3, WCF_4, WCF_6, WCF_8, WCF_9, WCF_10, WCF_13, WCF_14, WCF_19, WCF_20, WCF_21, WCF_22]
}
