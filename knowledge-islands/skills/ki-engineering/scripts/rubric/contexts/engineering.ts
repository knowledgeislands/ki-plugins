import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformCommand,
  ConformWrite,
  RubricContextOptions,
  RubricSession,
  ViolationLevel
} from '../../shared/rubric.ts'
import { collectAuditEvidence, type EngineeringEvidenceFinding } from './audit-evidence.ts'

export type EngineeringEvidence = readonly EngineeringEvidenceFinding[]

export type PackageRubricContext = {
  pkg1: EngineeringEvidence
  pkg2: EngineeringEvidence
  pkg3: EngineeringEvidence
  pkg4: EngineeringEvidence
  pkg5: EngineeringEvidence
  pkg6: EngineeringEvidence
  synchronise?: () => void
}

export type MiseRubricContext = {
  mise1: EngineeringEvidence
  mise2: EngineeringEvidence
  mise3: EngineeringEvidence
  scaffold?: () => void
}

export type CiRubricContext = { ci1: EngineeringEvidence; ci2: EngineeringEvidence }
export type ScriptsRubricContext = {
  scr1: EngineeringEvidence
  scr2: EngineeringEvidence
  scr3: EngineeringEvidence
  scr4: EngineeringEvidence
  scr5: EngineeringEvidence
  scr6: EngineeringEvidence
  scr7: EngineeringEvidence
  synchronisePackage?: () => void
}
export type BunRubricContext = Record<string, never>
export type TypescriptRubricContext = {
  tsc1: EngineeringEvidence
  tsc2: EngineeringEvidence
  scaffold?: () => void
}
export type BiomeRubricContext = {
  bio1: EngineeringEvidence
  bio2: EngineeringEvidence
  normalise?: () => void
  scaffold?: () => void
}
export type KnipRubricContext = {
  knip1: EngineeringEvidence
  knip2: EngineeringEvidence
  scaffold?: () => void
  repair?: () => void
}
export type SyncRubricContext = { sync1: EngineeringEvidence; normalise?: () => void }
export type DependenciesRubricContext = { deps1: EngineeringEvidence; update?: () => void }
export type GeneratedRubricContext = { gen1: EngineeringEvidence }
export type TestRubricContext = {
  test1: EngineeringEvidence
  test2: EngineeringEvidence
  test3: EngineeringEvidence
  test4: EngineeringEvidence
  test5: EngineeringEvidence
}
export type BuildRubricContext = {
  build1: EngineeringEvidence
  build2: EngineeringEvidence
  build3: EngineeringEvidence
  build4: EngineeringEvidence
}
export type EnvironmentRubricContext = { env1: EngineeringEvidence; env2: EngineeringEvidence }
export type TomlRubricContext = {
  toml1: EngineeringEvidence
  toml2: EngineeringEvidence
  declare?: () => void
}

export type EngineeringRubricContext = {
  package: PackageRubricContext
  mise: MiseRubricContext
  ci: CiRubricContext
  scripts: ScriptsRubricContext
  bun: BunRubricContext
  typescript: TypescriptRubricContext
  biome: BiomeRubricContext
  knip: KnipRubricContext
  sync: SyncRubricContext
  dependencies: DependenciesRubricContext
  generated: GeneratedRubricContext
  test: TestRubricContext
  build: BuildRubricContext
  environment: EnvironmentRubricContext
  toml: TomlRubricContext
}

export type EngineeringEvidenceInspector = (repository: string) => readonly EngineeringEvidenceFinding[]

export const auditEvidence = (
  evidence: EngineeringEvidence,
  defaultLevel: ViolationLevel,
  overrideLevels?: readonly ViolationLevel[]
): readonly AuditOutcome[] => {
  const outcomes = evidence.map((finding): AuditOutcome => {
    if (finding.level === 'PASS')
      return { status: 'PASS', message: finding.message, ...(finding.subject ? { subject: finding.subject } : {}) }
    if (finding.level === 'NOT_APPLICABLE')
      return { status: 'NOT_APPLICABLE', message: finding.message, ...(finding.subject ? { subject: finding.subject } : {}) }
    if (finding.level === 'INFO')
      return { status: 'INFO', message: finding.message, ...(finding.subject ? { subject: finding.subject } : {}) }
    const level = finding.level as ViolationLevel
    return {
      status: 'VIOLATION',
      message: finding.message,
      ...(finding.subject ? { subject: finding.subject } : {}),
      ...(level !== defaultLevel && overrideLevels?.includes(level) ? { level } : {})
    }
  })
  return outcomes.length ? outcomes : [{ status: 'NOT_APPLICABLE', message: 'This criterion did not apply to the target.' }]
}

const requiredDev = ['@biomejs/biome', 'knip', 'prettier', 'husky', 'lint-staged', 'markdownlint-cli2', 'syncpack', 'typescript']
const versions: Record<string, string> = {
  '@biomejs/biome': '^2.5.4',
  knip: '^6.27.0',
  prettier: '^3.9.5',
  husky: '^9.1.7',
  'lint-staged': '^17.1.0',
  'markdownlint-cli2': '^0.23.1',
  syncpack: '^15.3.2',
  typescript: '^7.0.2'
}
const lintStaged = {
  '*.{ts,tsx,js,jsx,json,jsonc}': ['bunx @biomejs/biome check --write --no-errors-on-unmatched'],
  '*.md': ['bunx prettier --write', 'bunx markdownlint-cli2 --no-globs']
}
const defaults = {
  'mise.toml': `[tools]\nnode = "22"\nbun = "1.3.14"\n`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es2024",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true
  },
  "include": ["src/**/*.ts"]
}
`,
  'biome.json': `{
  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["**", "!src/generated", "!.claude/skills", "!.claude/agents", "!.agents/skills"],
    "ignoreUnknown": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "lineWidth": 140,
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "none"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "suspicious": { "noExplicitAny": "off" }
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": { "organizeImports": "on" }
    }
  }
}
`,
  'knip.json': `{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignoreExportsUsedInFile": true
}
`
} as const

const legacyAggregateScript = (key: string): boolean =>
  key === 'ki:audit' || key === 'ki:conform' || key === 'ki:educate' || key === 'ki:help'

const legacyToolScript = (key: string): boolean =>
  /^ki:(lint|deps):/.test(key) || key === 'ki:knip' || key === 'ki:verify' || /^ki:[a-z-]+:lint$/.test(key)

const legacySkillModeScript = (key: string): boolean => /^ki:[a-z-]+:(audit|conform|educate|help)$/.test(key)

const legacyRuntimeOnlyScript = (value: string): boolean =>
  /^\s*(?:bun|node)\s+\S*(?:\.ki\/(?:bin|bootstrap)\/|scripts\/(?:govern|educate)\.ts|scripts\/rubric\/index\.ts|scripts\/vendored\/).*$/.test(
    value
  )

const isSafeRegularFile = (path: string): boolean => {
  if (!existsSync(path)) return false
  const metadata = lstatSync(path)
  return metadata.isFile() && !metadata.isSymbolicLink()
}

const packageContent = (source: string): string | undefined => {
  let value: Record<string, unknown>
  try {
    value = JSON.parse(source) as Record<string, unknown>
  } catch {
    return undefined
  }
  const packageJson = structuredClone(value)
  packageJson.type = 'module'
  packageJson.packageManager = 'bun@1.3.14'
  packageJson.engines = { ...((packageJson.engines as Record<string, string> | undefined) ?? {}), node: '>=22' }
  const devDependencies = { ...((packageJson.devDependencies as Record<string, string> | undefined) ?? {}) }
  for (const dependency of requiredDev) devDependencies[dependency] ??= versions[dependency] as string
  packageJson.devDependencies = devDependencies
  packageJson['lint-staged'] = lintStaged
  const scripts = { ...((packageJson.scripts as Record<string, string> | undefined) ?? {}) }
  for (const key of Object.keys(scripts)) {
    if (legacyAggregateScript(key) || legacyToolScript(key) || legacySkillModeScript(key) || legacyRuntimeOnlyScript(scripts[key] ?? ''))
      delete scripts[key]
  }
  scripts.clean = scripts.clean?.includes('node_modules') ? scripts.clean : 'rm -rf dist node_modules'
  scripts.prepare = 'husky'
  packageJson.scripts = scripts
  return `${JSON.stringify(packageJson, null, 2)}\n`
}

const evidenceByCode = (findings: readonly EngineeringEvidenceFinding[]): ((code: string) => readonly EngineeringEvidenceFinding[]) => {
  const grouped = new Map<string, EngineeringEvidenceFinding[]>()
  for (const finding of findings) {
    const values = grouped.get(finding.code) ?? []
    values.push(finding)
    grouped.set(finding.code, values)
  }
  return (code) => grouped.get(code) ?? []
}

export const createEngineeringSession = (
  { mode, repository }: RubricContextOptions,
  inspect: EngineeringEvidenceInspector = collectAuditEvidence
): RubricSession<EngineeringRubricContext> => {
  const target = resolve(repository)
  const mutable = mode === 'conform'
  const evidence = evidenceByCode(inspect(target))
  const packagePath = join(target, 'package.json')
  const packageSource = isSafeRegularFile(packagePath) ? readFileSync(packagePath, 'utf8') : undefined
  let synchronisePackage = false
  const scaffold = new Set<keyof typeof defaults>()
  let declareEngineering = false
  const requestedCommands = new Map<string, ConformCommand>()

  const requestCommands = (commands: readonly ConformCommand[]): void => {
    for (const command of commands) requestedCommands.set(JSON.stringify(command), command)
  }
  const requestScaffold = (name: keyof typeof defaults): void => {
    const path = join(target, name)
    if (!existsSync(path)) scaffold.add(name)
  }
  const requestEngineeringTable = (): void => {
    const path = join(target, '.ki-config.toml')
    if (!existsSync(path) || isSafeRegularFile(path)) declareEngineering = true
  }

  const packageContext: PackageRubricContext = {
    pkg1: evidence('PKG-1'),
    pkg2: evidence('PKG-2'),
    pkg3: evidence('PKG-3'),
    pkg4: evidence('PKG-4'),
    pkg5: evidence('PKG-5'),
    pkg6: evidence('PKG-6'),
    ...(mutable && packageSource !== undefined
      ? {
          synchronise: () => {
            synchronisePackage = true
          }
        }
      : {})
  }
  const synchronisePackageCapability =
    mutable && packageSource !== undefined
      ? {
          synchronisePackage: () => {
            synchronisePackage = true
          }
        }
      : {}

  const context: EngineeringRubricContext = {
    package: packageContext,
    mise: {
      mise1: evidence('MISE-1'),
      mise2: evidence('MISE-2'),
      mise3: evidence('MISE-3'),
      ...(mutable ? { scaffold: () => requestScaffold('mise.toml') } : {})
    },
    ci: { ci1: evidence('CI-1'), ci2: evidence('CI-2') },
    scripts: {
      scr1: evidence('SCR-1'),
      scr2: evidence('SCR-2'),
      scr3: evidence('SCR-3'),
      scr4: evidence('SCR-4'),
      scr5: evidence('SCR-5'),
      scr6: evidence('SCR-6'),
      scr7: evidence('SCR-7'),
      ...synchronisePackageCapability
    },
    bun: {},
    typescript: {
      tsc1: evidence('TSC-1'),
      tsc2: evidence('TSC-2'),
      ...(mutable ? { scaffold: () => requestScaffold('tsconfig.json') } : {})
    },
    biome: {
      bio1: evidence('BIO-1'),
      bio2: evidence('BIO-2'),
      ...(mutable
        ? {
            normalise: () =>
              requestCommands([
                { program: 'bunx', arguments: ['@biomejs/biome', 'check', '--write', '--unsafe'] },
                { program: 'bunx', arguments: ['@biomejs/biome', 'format', '--write'] }
              ]),
            scaffold: () => requestScaffold('biome.json')
          }
        : {})
    },
    knip: {
      knip1: evidence('KNIP-1'),
      knip2: evidence('KNIP-2'),
      ...(mutable
        ? {
            scaffold: () => requestScaffold('knip.json'),
            repair: () => requestCommands([{ program: 'bunx', arguments: ['knip', '--fix', '--no-config-hints'] }])
          }
        : {})
    },
    sync: {
      sync1: evidence('SYNC-1'),
      ...(mutable ? { normalise: () => requestCommands([{ program: 'bunx', arguments: ['syncpack', 'format'] }]) } : {})
    },
    dependencies: {
      deps1: evidence('DEPS-1'),
      ...(mutable
        ? {
            update: () =>
              requestCommands([
                { program: 'bun', arguments: ['update', '--latest'] },
                { program: 'bun', arguments: ['install'] }
              ])
          }
        : {})
    },
    generated: { gen1: evidence('GEN-1') },
    test: {
      test1: evidence('TEST-1'),
      test2: evidence('TEST-2'),
      test3: evidence('TEST-3'),
      test4: evidence('TEST-4'),
      test5: evidence('TEST-5')
    },
    build: {
      build1: evidence('BUILD-1'),
      build2: evidence('BUILD-2'),
      build3: evidence('BUILD-3'),
      build4: evidence('BUILD-4')
    },
    environment: { env1: evidence('ENV-1'), env2: evidence('ENV-2') },
    toml: {
      toml1: evidence('TOML-1'),
      toml2: evidence('TOML-2'),
      ...(mutable ? { declare: requestEngineeringTable } : {})
    }
  }

  return {
    subjects: [
      {
        families: ['PKG', 'MISE', 'CI', 'SCR', 'BUN', 'TSC', 'BIO', 'KNIP', 'SYNC', 'DEPS', 'GEN', 'TEST', 'BUILD', 'ENV', 'TOML'],
        context: () => context
      }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (synchronisePackage && packageSource !== undefined) {
        const content = packageContent(packageSource)
        if (content !== undefined && content !== packageSource) writes.push({ path: 'package.json', content })
      }
      for (const name of scaffold) writes.push({ path: name, content: defaults[name], create: true })
      if (declareEngineering) {
        const path = join(target, '.ki-config.toml')
        if (!existsSync(path)) writes.push({ path: '.ki-config.toml', content: '[ki-engineering]\n', create: true })
        else {
          const source = readFileSync(path, 'utf8')
          if (!/^\[ki-engineering\]/m.test(source))
            writes.push({ path: '.ki-config.toml', content: `${source.replace(/\n*$/, '\n\n')}[ki-engineering]\n` })
        }
      }
      return {
        writes,
        ...(requestedCommands.size ? { commands: [...requestedCommands.values()] } : {})
      }
    }
  }
}
