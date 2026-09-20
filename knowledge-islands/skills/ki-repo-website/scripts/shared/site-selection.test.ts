import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectWebsiteOverlay, inspectWebsiteSelection } from './site-selection.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-website-selection-'))
  roots.push(root)
  return root
}

test('preserves keyless and explicit single-site modes', () => {
  const root = repository()
  mkdirSync(join(root, 'apps', 'site'), { recursive: true })
  writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo-website]\n')
  expect(inspectWebsiteSelection(root)).toMatchObject({
    applicable: true,
    mode: 'single',
    primarySite: null,
    violations: [],
    sites: [{ name: null, root: 'apps/site', primary: true, physical: true }]
  })

  writeFileSync(join(root, '.ki.toml'), '[skills.ki-repo-website]\nsite-root = "."\n')
  expect(inspectWebsiteSelection(root).sites[0]?.root).toBe('.')
})

test('orders a valid named registry with its primary site first', () => {
  const root = repository()
  mkdirSync(join(root, 'apps', 'site-apex'), { recursive: true })
  mkdirSync(join(root, 'apps', 'site-tower'), { recursive: true })
  writeFileSync(
    join(root, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\ntower = "apps/site-tower"\napex = "apps/site-apex"\n'
  )

  const selection = inspectWebsiteSelection(root)

  expect(selection.violations).toEqual([])
  expect(selection.sites.map((site) => [site.name, site.root, site.primary])).toEqual([
    ['apex', 'apps/site-apex', true],
    ['tower', 'apps/site-tower', false]
  ])
})

test('rejects conflicting, malformed, duplicate, and non-physical registry entries', () => {
  const root = repository()
  mkdirSync(join(root, 'apps', 'one'), { recursive: true })
  writeFileSync(
    join(root, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "."\nprimary-site = "missing"\n\n[skills.ki-repo-website.sites]\nBad_Name = "apps/one"\none = "apps/one"\ntwo = "apps/one"\nthree = "../outside"\nfour = "apps/missing"\n'
  )

  expect(inspectWebsiteSelection(root).violations).toEqual([
    'site-root is mutually exclusive with primary-site and sites.',
    'Site name Bad_Name must use lower-kebab-case.',
    'Site root apps/one is declared more than once.',
    'Site three must select a canonical safe relative root.',
    'Site four root apps/missing must be a physical repository directory.',
    'primary-site missing must name a declared site.'
  ])
})

test('overlay selection defaults to every site and validates bounded subsets', () => {
  const root = repository()
  mkdirSync(join(root, 'apps', 'site-apex'), { recursive: true })
  mkdirSync(join(root, 'apps', 'site-tower'), { recursive: true })
  writeFileSync(
    join(root, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\napex = "apps/site-apex"\ntower = "apps/site-tower"\n\n[skills.ki-repo-website-content]\nsites = ["tower"]\n'
  )
  const selection = inspectWebsiteSelection(root)

  expect(inspectWebsiteOverlay(root, 'ki-repo-website-cloudflare', selection)).toMatchObject({ applicable: false })
  expect(inspectWebsiteOverlay(root, 'ki-repo-website-content', selection)).toMatchObject({
    applicable: true,
    violations: [],
    sites: [{ name: 'tower', root: 'apps/site-tower' }]
  })

  writeFileSync(
    join(root, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\napex = "apps/site-apex"\ntower = "apps/site-tower"\n\n[skills.ki-repo-website-content]\nsites = ["tower", "tower", "unknown"]\n'
  )
  expect(inspectWebsiteOverlay(root, 'ki-repo-website-content', inspectWebsiteSelection(root)).violations).toEqual([
    '[skills.ki-repo-website-content].sites must not repeat a site name.',
    '[skills.ki-repo-website-content].sites names unknown site unknown.'
  ])
})
