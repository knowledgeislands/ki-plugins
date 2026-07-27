import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricSession, RubricSubject } from '../../shared/rubric.ts'
import { type ConformDocumentState, createConformDocumentState, createSkillConformState } from './conform.ts'
import { createKiShapeContext, type KiSkillsRubricContext } from './contexts.ts'
import { parseFrontmatter } from './frontmatter.ts'
import { createRefreshContext } from './longevity.ts'
import { createSkillRubricContext, frontmatterList } from './skill.ts'
import { discoverSkillDirs, listMarkdownFiles } from './skill-files.ts'
import { stripCode } from './text.ts'

type KiSkillsSubjectScope =
  | 'target'
  | 'invalidSkill'
  | 'skill'
  | 'markdown'
  | 'reference'
  | 'portability'
  | 'longevity'
  | 'collision'
  | 'ownership'

type KiSkillsSubject = RubricSubject<KiSkillsRubricContext> & {
  scope: KiSkillsSubjectScope
}

/** Applicable rubric families for each kind of evidence subject. */
const KI_SKILLS_SUBJECT_FAMILIES = {
  target: ['LAY'],
  invalidSkill: ['LAY', 'FM'],
  skill: ['LAY', 'FM', 'NAME', 'DESC', 'OPT', 'SIZE', 'BODY', 'SCRIPT', 'KI-CHECKER', 'KI-SHAPE', 'KI-INVOKE', 'PROC'],
  markdown: ['LAY', 'KI-LINK'],
  reference: ['LAY', 'KI-LINK', 'REF'],
  portability: ['PORT'],
  longevity: ['LONG'],
  collision: ['COLL'],
  ownership: ['KI-SHAPE']
} as const satisfies Record<KiSkillsSubjectScope, readonly string[]>

const rubricSubject = (scope: KiSkillsSubjectScope, context: KiSkillsRubricContext, subject?: string): KiSkillsSubject => ({
  scope,
  families: KI_SKILLS_SUBJECT_FAMILIES[scope],
  context: () => context,
  ...(subject ? { subject } : {})
})

const markdownSubject = ({
  file,
  reportTarget,
  document
}: {
  file: string
  reportTarget: string
  document?: ConformDocumentState
}): KiSkillsSubject => {
  const isSkill = basename(file) === 'SKILL.md'
  const subject = relative(reportTarget, file)
  const scope = isSkill ? 'markdown' : 'reference'
  const markdown = document?.read() ?? readFileSync(file, 'utf8')
  const text = stripCode(markdown)
  return rubricSubject(
    scope,
    {
      layout: {
        markdown: text,
        sourceMarkdown: markdown,
        subject,
        ...(document ? { writeMarkdown: document.write } : {})
      },
      link: { markdown: text, relativeTargetExists: (target) => existsSync(resolve(dirname(file), target)) },
      references: { lineCount: markdown.split(/\r?\n/).length, content: markdown }
    },
    subject
  )
}

const ownershipCollisions = (directories: readonly string[]): { file: string; skills: string[] }[] => {
  const byFile = new Map<string, Set<string>>()
  for (const directory of directories) {
    const owns = frontmatterList(parseFrontmatter(readFileSync(join(directory, 'SKILL.md'), 'utf8')).keys.get('owns'))
    for (const file of owns) {
      if (!byFile.has(file)) byFile.set(file, new Set())
      byFile.get(file)?.add(basename(directory))
    }
  }
  return [...byFile].flatMap(([file, skills]) => (skills.size > 1 ? [{ file, skills: [...skills] }] : []))
}

/** Build one operation-scoped repository session for the generic KI rubric host. */
export const createKiSkillsSession = ({ mode, repository }: RubricContextOptions): RubricSession<KiSkillsRubricContext> => {
  const reportTarget = repository
  const skillDirectories = discoverSkillDirs(repository).sort()
  const subjects: KiSkillsSubject[] = []
  const documents: ConformDocumentState[] = []

  const target = resolve(repository)
  if (existsSync(target)) {
    const stat = statSync(target)
    const discovered = discoverSkillDirs(target)
    const context: KiSkillsRubricContext = {
      layout: {
        missingSkillRoot: stat.isDirectory() && discovered.length === 0 && !existsSync(join(target, 'SKILL.md')),
        standaloneMarkdownFile: stat.isFile() && extname(target).toLowerCase() === '.md'
      }
    }
    subjects.push(rubricSubject('target', context))
  }

  if (skillDirectories.length === 0) {
    if (subjects.length === 0) {
      const context: KiSkillsRubricContext = { layout: { noSkillsFound: true } }
      subjects.push(rubricSubject('target', context))
    }
    return { subjects, proposal: () => ({ writes: [] }) }
  }

  for (const skillDirectory of skillDirectories) {
    const conform = mode === 'conform' ? createSkillConformState(skillDirectory, reportTarget) : undefined
    const skill = createSkillRubricContext(skillDirectory, conform?.capabilities)
    const skillSubject = relative(reportTarget, skillDirectory) || '.'
    subjects.push(rubricSubject(skill.validFrontmatter ? 'skill' : 'invalidSkill', skill.context, skillSubject))
    if (conform) documents.push(conform.document)
    if (!skill.validFrontmatter) continue

    const runtimeBinding = parseFrontmatter(readFileSync(join(skillDirectory, 'SKILL.md'), 'utf8')).values['ki-runtime-binding'] === true

    for (const file of listMarkdownFiles(skillDirectory)) {
      const document =
        mode === 'conform'
          ? file === join(skillDirectory, 'SKILL.md')
            ? conform?.document
            : createConformDocumentState(file, reportTarget)
          : undefined
      if (document && document !== conform?.document) documents.push(document)
      subjects.push(markdownSubject({ file, reportTarget, document }))
      const subject = relative(reportTarget, file)
      subjects.push(
        rubricSubject(
          'portability',
          {
            portability: {
              markdown: document?.read() ?? readFileSync(file, 'utf8'),
              subject,
              runtimeBinding,
              attributedSourceMaterial: basename(file) === 'sources.md'
            }
          },
          subject
        )
      )
    }

    const sourcesPath = join(skillDirectory, 'references', 'sources.md')
    if (existsSync(sourcesPath)) {
      const context: KiSkillsRubricContext = { longevity: createRefreshContext(readFileSync(sourcesPath, 'utf8')) }
      subjects.push(rubricSubject('longevity', context))
    }
  }

  const collision: KiSkillsRubricContext = {
    collision: {
      targets: skillDirectories.map((directory) => ({
        name: basename(directory),
        description: parseFrontmatter(readFileSync(join(directory, 'SKILL.md'), 'utf8')).keys.get('description') ?? ''
      }))
    }
  }
  subjects.push(rubricSubject('collision', collision))

  const ownership: KiSkillsRubricContext = {
    shape: createKiShapeContext({ skill: null, ownershipCollisions: ownershipCollisions(skillDirectories) })
  }
  subjects.push(rubricSubject('ownership', ownership))

  return {
    subjects,
    proposal: () => ({
      writes: documents
        .flatMap((document) => {
          const write = document.proposal()
          return write ? [write] : []
        })
        .sort((left, right) => left.path.localeCompare(right.path))
    })
  }
}
