import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { judgment } from '../../shared/rubric.ts'
import { type KiLinkRubricContext, type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const relativeLinkTargets = (markdown: string): string[] => {
  const targets: string[] = []
  const links = /\[[^\]]*\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((match = links.exec(markdown)) !== null) {
    let target = (match[1] as string).trim()
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1).trim()
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('#')) continue
    const hash = target.indexOf('#')
    if (hash !== -1) target = target.slice(0, hash)
    if (target) targets.push(target)
  }
  return targets
}

const hasWikilink = (markdown: string): boolean => /\[\[[^\]]+\]\]/.test(markdown)

const KI_LINK_1: RubricItem<KiLinkRubricContext> = {
  code: 'KI-LINK-1',
  title: 'internal links use standard relative Markdown links',
  description: 'Internal links are **standard relative markdown links**, not wikilinks.',
  sources: ['ki-agentic-harness README'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Replace each wikilink with a standard relative Markdown link after identifying the intended local target and suitable link text.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ markdown }) =>
        hasWikilink(markdown)
          ? [{ status: 'VIOLATION', message: 'uses Obsidian wikilinks ([[...]]) — use relative markdown links' }]
          : [{ status: 'PASS', message: 'internal links use standard relative Markdown links' }]
    }
  }
}

const KI_LINK_2: RubricItem<KiLinkRubricContext> = {
  code: 'KI-LINK-2',
  title: 'relative link targets resolve',
  description: 'Links resolve — every relative target exists (angle-bracket form for paths with spaces).',
  sources: ['ki-agentic-harness README'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the relative target, restore the missing file, or remove the link according to the author’s intended relationship.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ markdown, relativeTargetExists }) => {
        const violations = relativeLinkTargets(markdown)
          .filter((target) => !relativeTargetExists(target))
          .map((target) => ({ status: 'VIOLATION' as const, message: `broken relative link → "${target}"` }))
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'relative link targets resolve' }]
      }
    }
  }
}

const KI_LINK_3: RubricItem<KiLinkRubricContext> = {
  code: 'KI-LINK-3',
  title: 'other skills are referred to by name',
  description: 'Other skills are referenced by `name`, never by file path.',
  sources: ['ki-agentic-harness README'],
  judgment: judgment('Are other skills referred to by their public name rather than by a file path?')
}

const KI_LINK_4: RubricItem<KiLinkRubricContext> = {
  code: 'KI-LINK-4',
  title: 'the house toolchain passes',
  description: 'The house toolchain passes: Biome (TS/JSON), rumdl (markdown).',
  sources: ['ki-agentic-harness README'],
  judgment: judgment('Does the repository pass its configured Biome and rumdl toolchain?')
}

export const KI_LINK: RubricFamily<KiSkillsRubricContext, KiLinkRubricContext> = {
  code: 'KI-LINK',
  title: 'Knowledge Islands linking & portability',
  description: 'Knowledge Islands link and toolchain portability.',
  standard: 'standards-knowledge-islands.md#1-linking-and-portability',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'link'),
  items: [KI_LINK_1, KI_LINK_2, KI_LINK_3, KI_LINK_4]
}
