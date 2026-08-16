import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { AUTOMATIC_REMEDIATION, judgment } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, type LayoutRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const hasBackslashLink = (markdown: string): boolean => /\[[^\]]*\]\([^)]*\\[^)]*\)/.test(markdown)
const normaliseLinkSlashes = (markdown: string): string =>
  markdown.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (whole, text, target) =>
    (target as string).includes('\\') ? `[${text}](${(target as string).replace(/\\/g, '/')})` : whole
  )

const LAY_1: RubricItem<LayoutRubricContext> = {
  code: 'LAY-1',
  title: 'SKILL.md exists at the skill root',
  description: '`SKILL.md` exists at the skill root.',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Create the missing SKILL.md only after establishing the intended skill identity and authored instructions for that root.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ missingSkillRoot, noSkillsFound }) => {
        if (noSkillsFound) return [{ status: 'VIOLATION', message: 'No skills were found below the requested target.' }]
        if (missingSkillRoot) return [{ status: 'VIOLATION', message: 'SKILL.md is missing at the skill root' }]
        return [{ status: 'PASS', message: 'SKILL.md exists at the skill root' }]
      }
    }
  }
}

const LAY_2: RubricItem<LayoutRubricContext> = {
  code: 'LAY-2',
  title: 'the skill is a directory named after the skill',
  description: 'The skill is a **directory** named after the skill, with `SKILL.md` inside — not a bare `.md`.',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Choose the intended skill name, create its directory, and move or rewrite the standalone Markdown as that directory’s SKILL.md.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ standaloneMarkdownFile }) =>
        standaloneMarkdownFile
          ? [
              {
                status: 'VIOLATION',
                message: 'a standalone Markdown file is not a skill; place SKILL.md in a skill directory'
              }
            ]
          : [{ status: 'PASS', message: 'the skill is a directory named after the skill' }]
    }
  }
}

const LAY_3: RubricItem<LayoutRubricContext> = {
  code: 'LAY-3',
  title: 'optional directories use standard names',
  description:
    'Optional subdirs use the standard names `references/`, `scripts/`, `assets/`; KI-governed skills may additionally use `.ki-meta/` for their local generated state.',
  sources: ['SPEC', 'KI'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Classify each nonstandard support directory by purpose, then rename or relocate it to references/, scripts/, assets/, or .ki-meta/ and repair affected links.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ supportDirectories }) => {
        if (supportDirectories === undefined)
          return [{ status: 'NOT_APPLICABLE', message: 'support directories were not inspected for this subject' }]
        const violations = supportDirectories
          .filter((directory) => !['references', 'scripts', 'assets', '.ki-meta'].includes(directory))
          .map((directory) => ({
            status: 'VIOLATION' as const,
            message: `support directory "${directory}" must be named references, scripts, assets, or .ki-meta`
          }))
        return violations.length > 0
          ? [violations[0] as (typeof violations)[number], ...violations.slice(1)]
          : [{ status: 'PASS', message: 'optional directories use standard names' }]
      }
    }
  }
}

const LAY_4: RubricItem<LayoutRubricContext> = {
  code: 'LAY-4',
  title: 'file references use forward slashes',
  description: 'File references use forward slashes, never backslashes.',
  sources: ['BP'],
  mechanical: {
    level: 'FAIL',
    remediation: AUTOMATIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ markdown }) => {
        if (markdown === undefined)
          return [{ status: 'NOT_APPLICABLE', message: 'Markdown is unavailable for link inspection' }]
        return hasBackslashLink(markdown)
          ? [{ status: 'VIOLATION', message: 'a link target uses backslashes — use forward slashes' }]
          : [{ status: 'PASS', message: 'file references use forward slashes' }]
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: ({ sourceMarkdown, writeMarkdown }) => {
        if (sourceMarkdown === undefined || !writeMarkdown) return
        const normalised = normaliseLinkSlashes(sourceMarkdown)
        if (normalised !== sourceMarkdown) writeMarkdown(normalised)
      }
    }
  }
}

const LAY_5: RubricItem<LayoutRubricContext> = {
  code: 'LAY-5',
  title: 'reference chains are shallow',
  description: 'Reference files are **one level deep** from `SKILL.md` — no nested chains (SKILL → a → b → c).',
  sources: ['BP', 'SPEC'],
  judgment: judgment('Are supporting files one level deep from SKILL.md, without nested reference chains?')
}

const LAY_6: RubricItem<LayoutRubricContext> = {
  code: 'LAY-6',
  title: 'supporting files are named by their content',
  description: 'Supporting files are named by content (`form-validation-rules.md`, not `doc2.md`).',
  sources: ['BP'],
  judgment: judgment('Do supporting file names clearly describe their contents?')
}

export const LAYOUT: RubricFamily<KiSkillsRubricContext, LayoutRubricContext> = {
  code: 'LAY',
  title: 'File existence & layout',
  description: 'Portable skill layout and supporting-file structure.',
  standard: 'standards-agent-skills.md#2-layout',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'layout'),
  items: [LAY_1, LAY_2, LAY_3, LAY_4, LAY_5, LAY_6]
}
