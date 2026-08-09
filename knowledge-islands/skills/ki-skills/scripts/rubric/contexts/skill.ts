import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import type { RubricPublication } from '../../shared/rubric.ts'
import {
  createKiShapeContext,
  createKiShapeFrontmatterEvidence,
  type KiShapeSkillContext,
  type KiSkillsRubricContext
} from './contexts.ts'
import { type ParsedFrontmatter, parseFrontmatter } from './frontmatter.ts'
import { scriptHelpEvidence } from './scripts.ts'
import { listMarkdownFiles } from './skill-files.ts'
import { stripCode } from './text.ts'
import { estimateTokens } from './tokens.ts'

export const frontmatterList = (value: string | undefined): string[] => {
  if (!value) return []
  const contents = value.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!contents.trim()) return []
  return contents
    .split(',')
    .map((entry) => entry.trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2'))
    .filter(Boolean)
}

export type SkillWritableCapabilities = {
  readContent?: () => string
  setName?: (name: string) => void
  addArgumentHintVerbs?: (verbs: readonly string[]) => void
}

type SkillRubricContext = {
  context: KiSkillsRubricContext
  validFrontmatter: boolean
}

const isLocalGovernanceSource = (directory: string): boolean =>
  basename(directory) === 'ki-self' &&
  basename(dirname(directory)) === 'skills' &&
  basename(dirname(dirname(directory))) === '.agents'

const relativeImportSpecifiers = (source: string): string[] =>
  [...source.matchAll(/\b(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"](\.\.?\/[^'"]+)['"]/g)].map(
    (match) => match[1] as string
  )

const listScriptFiles = (scriptsDirectory: string): string[] => {
  if (!existsSync(scriptsDirectory)) return []
  const scriptFiles: string[] = []
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name)
      if (entry.isDirectory()) walk(entryPath)
      else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))
        scriptFiles.push(entryPath)
    }
  }
  walk(scriptsDirectory)
  return scriptFiles
}

const listReferenceFiles = (referencesDirectory: string): string[] => {
  if (!existsSync(referencesDirectory)) return []
  const files: string[] = []
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name)
      if (entry.isDirectory()) walk(entryPath)
      else if (entry.isFile()) files.push(relative(referencesDirectory, entryPath))
    }
  }
  walk(referencesDirectory)
  return files.sort()
}

const rubricFamilyModules = (
  scriptsDirectory: string
): {
  itemsIndexExists: boolean
  itemsIndexDefinesRules: boolean
  familyModules: readonly {
    collection: string
    source: string | null
    exportsOrderedCollection: boolean
    unexpectedExports: readonly string[]
  }[]
} => {
  const indexPath = join(scriptsDirectory, 'rubric', 'items', 'index.ts')
  if (!existsSync(indexPath)) return { itemsIndexExists: false, itemsIndexDefinesRules: false, familyModules: [] }

  const indexSource = readFileSync(indexPath, 'utf8')
  const imports = new Map<string, string>()
  for (const match of indexSource.matchAll(/import\s+(?:type\s+)?{([^}]*)}\s*from\s*['"](\.\/[^'"]+)['"]/g)) {
    const specifier = match[2] as string
    for (const imported of (match[1] as string).split(',')) {
      const name = imported.trim().split(/\s+as\s+/)[0]
      if (name) imports.set(name, specifier)
    }
  }

  const families = indexSource.match(/\bfamilies:\s*\[([\s\S]*?)]/m)?.[1] ?? ''
  const collections = [...new Set([...families.matchAll(/\b([A-Z][A-Z0-9_]*)\b/g)].map((match) => match[1] as string))]
  const familyModules = collections.map((collection) => {
    const specifier = imports.get(collection)
    const modulePath = specifier ? resolve(dirname(indexPath), `${specifier.replace(/\.ts$/, '')}.ts`) : null
    const source = modulePath && existsSync(modulePath) ? readFileSync(modulePath, 'utf8') : null
    const collectionMatch = source?.match(
      new RegExp(`export\\s+const\\s+${collection}\\b[\\s\\S]*?=\\s*\\{[\\s\\S]*?\\bitems:\\s*\\[([\\s\\S]*?)]`, 'm')
    )
    const members = collectionMatch
      ? [
          ...new Set(
            [...(collectionMatch[1] as string).matchAll(/\b([A-Z][A-Z0-9_]+)\b/g)].map((match) => match[1] as string)
          )
        ]
      : []
    const factoryFamily = new RegExp(
      `export\\s+const\\s+${collection}\\b[\\s\\S]*?=\\s*createRubricPublicationFamily\\b`,
      'm'
    ).test(source ?? '')
    const exportsOrderedCollection =
      (collectionMatch !== null && collectionMatch !== undefined && members.length > 0) || factoryFamily
    const publicExports = source
      ? [
          ...source.matchAll(
            /^export\s+(?:const|function|class|interface|type|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)|^export\s+default\b/gm
          )
        ].map((match) => match[1] ?? 'default')
      : []
    const unexpectedExports = publicExports.filter((name) => name !== collection)
    return { collection, source, exportsOrderedCollection, unexpectedExports }
  })

  return {
    itemsIndexExists: true,
    itemsIndexDefinesRules: /\b(?:mechanical|judgment)\s*:|\brun\s*:/.test(indexSource),
    familyModules
  }
}

const extractSection = (body: string, heading: string): string | null => {
  const match = new RegExp(`^##\\s+${heading}\\s*$`, 'im').exec(body)
  if (!match) return null
  const rest = body.slice((match.index ?? 0) + match[0].length)
  const next = rest.search(/^##\s+/m)
  return next === -1 ? rest : rest.slice(0, next)
}

const extractBodyModes = (section: string | null): Set<string> => {
  const modes = new Set<string>()
  if (!section) return modes
  for (const match of section.matchAll(/^###\s+Mode\s+(\w+)/gim)) modes.add((match[1] as string).toUpperCase())
  let headerSeen = false
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line.startsWith('|')) {
      headerSeen = false
      continue
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
    if (!headerSeen) {
      if (/^mode$/i.test(cells[0] ?? '')) headerSeen = true
      continue
    }
    const mode = (cells[0] ?? '').replace(/`/g, '').trim()
    if (!/^:?-+:?$/.test(mode) && mode) modes.add(mode.toUpperCase())
  }
  return modes
}

const ENDORSE_EXTENSION_RES = [
  /\bprefer that (extension )?skill\b/i,
  /delegat\w*[^.\n]*\bmodes?\b[^.\n]*\bback\b/i,
  /\bextends this one\b/i
]
const DISAVOWAL_CUE = /retir|never|forbid|\bflag|heurist|anti-pattern|disavow|must not|do not/i

const endorsesRetiredExtension = (markdown: string): boolean => {
  const stripped = stripCode(markdown).replace(/"[^"\n]*"/g, '')
  return stripped
    .split(/\r?\n/)
    .some((line) => !DISAVOWAL_CUE.test(line) && ENDORSE_EXTENSION_RES.some((pattern) => pattern.test(line)))
}

/** Build the complete KI shape evidence used by both AUDIT and CONFORM fallback checks. */
const createKiShapeEvidence = (
  skillDirectory: string,
  frontmatter: ParsedFrontmatter,
  body: string
): KiShapeSkillContext => {
  const localGovernanceSource = isLocalGovernanceSource(skillDirectory)
  const section = extractSection(body, 'Operating modes')
  const markdownFiles = listMarkdownFiles(skillDirectory)
  const referenceText = markdownFiles
    .filter((file) => basename(file) !== 'SKILL.md')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const skillText = `${body}\n${referenceText}`
  const scriptsDirectory = join(skillDirectory, 'scripts')
  const scriptNames = existsSync(scriptsDirectory) ? readdirSync(scriptsDirectory) : []
  const referencePaths = listReferenceFiles(join(skillDirectory, 'references'))
  const refreshReference = join(skillDirectory, 'references', 'mode-refresh.md')
  const refreshSection = section?.match(/^###\s+Mode\s+REFRESH\b[\s\S]*?(?=^###\s+Mode\s+|$(?![\s\S]))/im)?.[0] ?? ''
  const rubricItemSources = listScriptFiles(join(scriptsDirectory, 'rubric', 'items'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const implementationSource = listScriptFiles(scriptsDirectory)
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  return {
    ...createKiShapeFrontmatterEvidence({ frontmatter, scriptNames, localGovernanceSource }),
    referencePaths,
    operatingModesSection: section,
    bodyModes: extractBodyModes(section),
    operatingModesIntro: section?.split(/^###\s+|^\s*\|/m)[0] ?? '',
    flatModeHeadings: [...stripCode(body).matchAll(/^##\s+Mode\s+(\w+)/gim)].map((match) => match[1] as string),
    bareModeHeadings: section
      ? [...stripCode(section).matchAll(/^###\s+(?!Mode\b)(\S[^\n]*)/gim)].map((match) => (match[1] as string).trim())
      : [],
    refreshText: `${refreshSection}${existsSync(refreshReference) ? `\n${readFileSync(refreshReference, 'utf8')}` : ''}`,
    retiredExtensionFiles: markdownFiles
      .filter((file) => endorsesRetiredExtension(basename(file) === 'SKILL.md' ? body : readFileSync(file, 'utf8')))
      .map((file) => file.slice(skillDirectory.length + 1)),
    strongGate: /do not edit[^.\n]*directly|go through (a )?proposal|standing directive|installing the gate/i.test(
      stripCode(skillText)
    ),
    anchorMentioned: /CLAUDE\.md|AGENTS\.md|always-loaded|installing the gate|\banchor/i.test(skillText),
    rubricReadsAnchor: /CLAUDE\.md|AGENTS\.md/.test(implementationSource),
    mechanicalRubricCount: (rubricItemSources.match(/\bmechanical\s*:/g) ?? []).length,
    hasMechanicalImplementation:
      scriptNames.some((name) => name.endsWith('.ts')) ||
      existsSync(join(scriptsDirectory, 'rubric', 'items', 'index.ts')),
    documentsMechanicalDelegation: /lint:md|toolchain (?:already )?enforces/i.test(skillText),
    dependsOnPresent: frontmatter.present.has('ki-depends-on'),
    dependsOn: (frontmatter.keys.get('ki-depends-on') ?? '').trim(),
    supportedRuntimesPresent: frontmatter.present.has('ki-supported-runtimes'),
    supportedRuntimes: (frontmatter.keys.get('ki-supported-runtimes') ?? '').trim(),
    runtimeBinding: frontmatter.values['ki-runtime-binding'] === true,
    owns: frontmatterList(frontmatter.keys.get('owns')),
    contributes: frontmatterList(frontmatter.keys.get('contributes')),
    requires: frontmatterList(frontmatter.keys.get('requires')),
    implementationSource: implementationSource || null
  }
}

/** Build the same complete per-skill evidence for AUDIT and CONFORM. */
export const createSkillRubricContext = (
  directory: string,
  capabilities: SkillWritableCapabilities = {},
  publication?: RubricPublication
): SkillRubricContext => {
  const readContent = capabilities.readContent ?? (() => readFileSync(join(directory, 'SKILL.md'), 'utf8'))
  const content = readContent()
  const frontmatter = parseFrontmatter(content)
  const validFrontmatter = frontmatter.raw !== null && frontmatter.isMapping
  const supportDirectories = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  const frontmatterContext = { hasBlock: frontmatter.raw !== null, isMapping: frontmatter.isMapping }

  if (!frontmatter.isMapping)
    return { validFrontmatter, context: { layout: { supportDirectories }, frontmatter: frontmatterContext } }

  const name = frontmatter.keys.get('name')
  const description = frontmatter.keys.get('description')
  const localGovernanceSource = isLocalGovernanceSource(directory)
  const body = content.slice((content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/) || [''])[0].length)
  const scriptsDirectory = join(directory, 'scripts')
  const sharedDirectory = join(scriptsDirectory, 'shared')
  const familyEvidence = rubricFamilyModules(scriptsDirectory)
  const imports = listScriptFiles(scriptsDirectory).flatMap((scriptPath) =>
    relativeImportSpecifiers(readFileSync(scriptPath, 'utf8')).map((specifier) => {
      const resolved = resolve(dirname(scriptPath), specifier)
      return {
        entry: relative(scriptsDirectory, scriptPath),
        specifier,
        resolvesInsideScripts: resolved.startsWith(`${scriptsDirectory}/`)
      }
    })
  )

  return {
    validFrontmatter,
    context: {
      layout: { supportDirectories },
      frontmatter: frontmatterContext,
      name: {
        name,
        directoryName: localGovernanceSource ? 'ki-self' : basename(directory),
        localGovernanceSource,
        reservedVendorNameAllowed:
          frontmatter.values['ki-runtime-binding'] === true &&
          /^\[[^\]]*\bclaude-code\b[^\]]*]$/.test((frontmatter.keys.get('ki-supported-runtimes') ?? '').trim()),
        setName: capabilities.setName
      },
      description: { description },
      optional: {
        compatibility: frontmatter.keys.get('compatibility'),
        metadataPresent: frontmatter.present.has('metadata'),
        metadata: frontmatter.values.metadata,
        allowedToolsPresent: frontmatter.present.has('allowed-tools'),
        allowedTools: frontmatter.values['allowed-tools'],
        disallowedToolsPresent: frontmatter.present.has('disallowed-tools'),
        disallowedTools: frontmatter.values['disallowed-tools'],
        licensePresent: frontmatter.present.has('license'),
        license: frontmatter.values.license
      },
      scripts: { helpEvidence: scriptHelpEvidence(directory) },
      checker: {
        imports,
        rootSkill: name === 'ki-skills',
        declaredSharedModules: frontmatterList(frontmatter.keys.get('ki-shared-modules')),
        sharedDependencies: frontmatterList(frontmatter.keys.get('ki-shared-dependencies')),
        legacyLibPresent: existsSync(join(scriptsDirectory, 'lib')),
        presentSharedModules: existsSync(sharedDirectory)
          ? readdirSync(sharedDirectory, { withFileTypes: true })
              .filter((entry) => entry.isDirectory() || (entry.isFile() && !entry.name.endsWith('.test.ts')))
              .map((entry) => (entry.isFile() && entry.name.endsWith('.ts') ? entry.name.slice(0, -3) : entry.name))
              .sort()
          : [],
        rubricModuleExists: existsSync(join(sharedDirectory, 'rubric.ts')),
        structuredRubricRequired: name === 'ki-skills' || frontmatter.present.has('ki-shared-dependencies'),
        ...familyEvidence
      },
      ...(name === 'ki-skills' ? { rubric: { publication } } : {}),
      shape: createKiShapeContext({
        skill: createKiShapeEvidence(directory, frontmatter, body),
        addArgumentHintVerbs: capabilities.addArgumentHintVerbs
      }),
      size: { bodyLines: body.split(/\r?\n/).length, bodyTokens: estimateTokens(body) }
    }
  }
}
