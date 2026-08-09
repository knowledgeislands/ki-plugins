import type { RubricPublicationContext } from '../../shared/rubric.ts'
import type { ParsedFrontmatter } from './frontmatter.ts'
import type { RefreshContext } from './longevity.ts'
import { hintVerbs, isProcessSkill } from './modes.ts'

export type DescriptionRubricContext = {
  description: string | undefined
}

export type FrontmatterRubricContext = {
  hasBlock: boolean
  isMapping: boolean
}

export type NameRubricContext = {
  name: string | undefined
  directoryName: string
  localGovernanceSource: boolean
  reservedVendorNameAllowed: boolean
  setName?: (name: string) => void
}

export type OptionalRubricContext = {
  compatibility: string | undefined
  metadataPresent: boolean
  metadata: unknown
  allowedToolsPresent: boolean
  allowedTools: unknown
  disallowedToolsPresent: boolean
  disallowedTools: unknown
  licensePresent: boolean
  license: unknown
}

export type SizeRubricContext = {
  bodyLines?: number
  bodyTokens?: number
}

export type ReferencesRubricContext = {
  lineCount: number
  content: string
}

export type ScriptHelpEvidence = {
  subject: string
  declaresPurpose: boolean
  declaresCanonicalRun: boolean
  declaresBoundary: boolean
  declaresShortHelp: boolean
  declaresLongHelp: boolean
  declaresUsageText: boolean
}

export type ScriptsRubricContext = {
  helpEvidence: readonly ScriptHelpEvidence[]
}

export type LayoutRubricContext = {
  markdown?: string
  sourceMarkdown?: string
  subject?: string
  writeMarkdown?: (markdown: string) => void
  missingSkillRoot?: boolean
  noSkillsFound?: boolean
  standaloneMarkdownFile?: boolean
  supportDirectories?: readonly string[]
}

export type KiLinkRubricContext = {
  markdown: string
  relativeTargetExists: (target: string) => boolean
}

export type PortabilityRubricContext = {
  markdown: string
  subject: string
  runtimeBinding: boolean
  attributedSourceMaterial: boolean
}

type CheckerImport = {
  entry: string
  specifier: string
  resolvesInsideScripts: boolean
}

type RubricFamilyModule = {
  collection: string
  source: string | null
  exportsOrderedCollection: boolean
  unexpectedExports: readonly string[]
}

export type KiCheckerRubricContext = {
  imports: readonly CheckerImport[]
  rootSkill: boolean
  declaredSharedModules: readonly string[]
  sharedDependencies: readonly string[]
  legacyLibPresent: boolean
  presentSharedModules: readonly string[]
  rubricModuleExists: boolean
  structuredRubricRequired: boolean
  itemsIndexExists: boolean
  itemsIndexDefinesRules: boolean
  familyModules: readonly RubricFamilyModule[]
}

export type RubricPublicationRubricContext = RubricPublicationContext

type CollisionTarget = {
  name: string
  description: string
}

export type CollisionRubricContext = { targets: readonly CollisionTarget[] }

export type LongevityRubricContext = RefreshContext

type OwnershipCollision = {
  file: string
  skills: readonly string[]
}

export type KiShapeSkillContext = {
  knowledgeIslandsSkill: boolean
  kiKindPresent: boolean
  kiKind: string
  governanceSkill: boolean
  localGovernanceSource: boolean
  argumentHint: string | undefined
  hintVerbs: readonly string[]
  scriptNames: readonly string[]
  referencePaths: readonly string[]
  operatingModesSection: string | null
  bodyModes: ReadonlySet<string>
  operatingModesIntro: string
  flatModeHeadings: readonly string[]
  bareModeHeadings: readonly string[]
  refreshText: string
  retiredExtensionFiles: readonly string[]
  strongGate: boolean
  anchorMentioned: boolean
  rubricReadsAnchor: boolean
  mechanicalRubricCount: number
  hasMechanicalImplementation: boolean
  documentsMechanicalDelegation: boolean
  dependsOnPresent: boolean
  dependsOn: string
  supportedRuntimesPresent: boolean
  supportedRuntimes: string
  runtimeBinding: boolean
  owns: readonly string[]
  contributes: readonly string[]
  requires: readonly string[]
  implementationSource: string | null
}

export type KiShapeRubricContext = {
  skill: KiShapeSkillContext | null
  ownershipCollisions: readonly OwnershipCollision[]
  addArgumentHintVerbs?: (verbs: readonly string[]) => void
}

export const createKiShapeFrontmatterEvidence = ({
  frontmatter,
  scriptNames,
  localGovernanceSource = false
}: {
  frontmatter: ParsedFrontmatter
  scriptNames: readonly string[]
  localGovernanceSource?: boolean
}): Pick<
  KiShapeSkillContext,
  | 'knowledgeIslandsSkill'
  | 'kiKindPresent'
  | 'kiKind'
  | 'governanceSkill'
  | 'localGovernanceSource'
  | 'argumentHint'
  | 'hintVerbs'
  | 'scriptNames'
> => {
  const argumentHint = frontmatter.keys.get('argument-hint')
  const kiKind = (frontmatter.keys.get('ki-kind') ?? '').trim()
  return {
    knowledgeIslandsSkill: (frontmatter.keys.get('name') ?? '').startsWith('ki-'),
    kiKindPresent: frontmatter.present.has('ki-kind'),
    kiKind,
    governanceSkill: !isProcessSkill(kiKind) && kiKind === 'governance',
    localGovernanceSource,
    argumentHint,
    hintVerbs: hintVerbs(argumentHint ?? ''),
    scriptNames
  }
}

const emptyKiShapeSkill: KiShapeSkillContext = {
  knowledgeIslandsSkill: false,
  kiKindPresent: false,
  kiKind: '',
  governanceSkill: false,
  localGovernanceSource: false,
  argumentHint: undefined,
  hintVerbs: [],
  scriptNames: [],
  referencePaths: [],
  operatingModesSection: null,
  bodyModes: new Set(),
  operatingModesIntro: '',
  flatModeHeadings: [],
  bareModeHeadings: [],
  refreshText: '',
  retiredExtensionFiles: [],
  strongGate: false,
  anchorMentioned: false,
  rubricReadsAnchor: false,
  mechanicalRubricCount: 0,
  hasMechanicalImplementation: false,
  documentsMechanicalDelegation: false,
  dependsOnPresent: false,
  dependsOn: '',
  supportedRuntimesPresent: false,
  supportedRuntimes: '',
  runtimeBinding: false,
  owns: [],
  contributes: [],
  requires: [],
  implementationSource: null
}

export const createKiShapeContext = ({
  skill,
  ownershipCollisions = [],
  addArgumentHintVerbs
}: {
  skill: Partial<KiShapeSkillContext> | null
  ownershipCollisions?: readonly OwnershipCollision[]
  addArgumentHintVerbs?: (verbs: readonly string[]) => void
}): KiShapeRubricContext => ({
  skill: skill === null ? null : { ...emptyKiShapeSkill, ...skill },
  ownershipCollisions,
  addArgumentHintVerbs
})

type KiSkillsRubricFacets = {
  layout: LayoutRubricContext
  frontmatter: FrontmatterRubricContext
  name: NameRubricContext
  description: DescriptionRubricContext
  optional: OptionalRubricContext
  size: SizeRubricContext
  references: ReferencesRubricContext
  scripts: ScriptsRubricContext
  checker: KiCheckerRubricContext
  rubric: RubricPublicationRubricContext
  link: KiLinkRubricContext
  portability: PortabilityRubricContext
  shape: KiShapeRubricContext
  collision: CollisionRubricContext
  longevity: LongevityRubricContext
}

/** A subject supplies only the evidence facets declared by its applicable families. */
export type KiSkillsRubricContext = Partial<KiSkillsRubricFacets>

/** Fail closed when subject routing does not supply a family's required evidence. */
export const selectKiSkillsContext = <Facet extends keyof KiSkillsRubricFacets>(
  context: KiSkillsRubricContext,
  facet: Facet
): KiSkillsRubricFacets[Facet] => {
  const selected = context[facet]
  if (selected === undefined) throw new Error(`ki-skills subject does not provide ${facet} evidence`)
  return selected
}
