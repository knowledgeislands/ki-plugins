import type { RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, MarkdownRubricContext } from '../contexts/authoring.ts'

const markdownMechanicalAudit = (
  context: MarkdownRubricContext
): RubricOutcomes<{
  status: 'PASS' | 'VIOLATION'
  message: string
  subject: string
}> => {
  if (!context.exists)
    return [{ status: 'VIOLATION', message: 'audit target is missing or is not a directory', subject: context.target }]
  return context.audit.clean
    ? [{ status: 'PASS', message: 'rumdl clean', subject: context.target }]
    : [
        {
          status: 'VIOLATION',
          message: `Markdown mechanical check failed — run "ki repo conform --skill ki-authoring" to fix${
            context.audit.detail ? `\n    ${context.audit.detail}` : ''
          }`,
          subject: context.target
        }
      ]
}

const MD_MECH: RubricItem<MarkdownRubricContext> = {
  code: 'MD-mech',
  title: 'Markdown mechanical gate passes',
  description:
    '`ki repo audit --skill ki-authoring` passes: prose is unwrapped; bullet and quote characters, heading hierarchy, a single H1, spacing, resolved references, no bare URLs, and descriptive link text satisfy rumdl, which runs directly inside the audit. Table alignment is not mechanically enforced — no rumdl style reproduces the former conditional padding, so the width conventions in the Markdown standard carry it.',
  sources: ['standards-authoring.md#markdown-gate', 'standards-markdown.md#what-to-leave-to-the-linter'],
  mechanical: {
    level: 'FAIL',
    cost: 2,
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: markdownMechanicalAudit },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.normalise?.()
      }
    }
  }
}

const MD_FRONTMATTER: RubricItem<MarkdownRubricContext> = {
  code: 'MD-frontmatter',
  title: 'frontmatter uses canonical bare-safe scalars',
  description:
    'Markdown frontmatter leaves identifier-like scalar tokens unquoted when their YAML meaning is unchanged; quoted YAML-significant values, dates, numeric-looking values, punctuation, whitespace, and escaped strings remain quoted.',
  sources: ['standards-markdown.md#frontmatter'],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: ({ frontmatter: { files } }) =>
        files.length === 0
          ? [{ status: 'PASS', message: 'frontmatter scalars are canonical' }]
          : files.map(({ path, count }) => ({
              status: 'VIOLATION' as const,
              message: `frontmatter has ${count} unnecessarily quoted bare-safe scalar${count === 1 ? '' : 's'}`,
              subject: path
            }))
    },
    conform: {
      phase: 'NORMALISE',
      run: ({ frontmatter: { files } }) => {
        for (const file of files) file.normalise?.()
      }
    }
  }
}

const MD_TABLE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-table',
  title: 'wide tables are reshaped',
  description:
    'A table with rows that would exceed `printWidth` (120 chars) is reshaped into subheadings or a bulleted definition list; genuinely tabular data with one long column keeps the table and moves that column to footnotes below it.',
  sources: ['standards-markdown.md#tables-and-footnotes'],
  judgment: {
    scope: 'Every authored Markdown table that is wide or contains descriptive prose.',
    prompt: 'Assess whether wide or prose-heavy tables are reshaped according to the Markdown convention.',
    outcomes: ['conforming', 'reshape required', 'exclusion'],
    guidance:
      'Reshape the table into subheadings or a definition list, move a long column to footnotes, or record why genuinely tabular content is excluded.'
  }
}

const MD_FOOTNOTE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-footnote',
  title: 'table footnotes use the house marker series',
  description:
    'Footnotes use the marker series `† ‡ § ¶ ‖` (then doubled), reset per table, with a distinct second series `※ ❡ ¤ ¥` where needed; each footnote is a separate paragraph.',
  sources: ['standards-markdown.md#footnote-marker-series'],
  judgment: {
    scope: 'Every table footnote in authored Markdown.',
    prompt: 'Assess whether table footnotes use the documented marker series and paragraph layout.',
    outcomes: ['conforming', 'correction required', 'exclusion'],
    guidance: 'Use the documented marker series and one paragraph per footnote, or record why the table is excluded.'
  }
}

const MD_LINK: RubricItem<MarkdownRubricContext> = {
  code: 'MD-link',
  title: 'house-file links are descriptive and portable',
  description:
    'House-file links are descriptive relative Markdown links rather than wikilinks; paths with spaces use angle brackets. KB note content and agent prompts remain explicitly scoped exceptions.',
  sources: ['standards-markdown.md#links'],
  judgment: {
    scope: 'Every house-file Markdown link outside the explicitly scoped KB-note and agent-prompt exceptions.',
    prompt: 'Assess whether links are descriptive, relative Markdown links where this convention applies.',
    outcomes: ['conforming', 'correction required', 'scoped exception'],
    guidance:
      'Replace the link with descriptive relative Markdown, use angle brackets for paths with spaces, or record the applicable scoped exception.'
  }
}

const MD_CELL_PROSE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-cell-prose',
  title: 'tables avoid descriptive prose in cells',
  description: 'Tables avoid long descriptive prose in cells — that is the footnote’s job.',
  sources: ['standards-markdown.md#keeping-tables-skimmable'],
  judgment: {
    scope: 'Every authored Markdown table containing descriptive text.',
    prompt: 'Assess whether table cells avoid long descriptive prose.',
    outcomes: ['conforming', 'move prose required', 'exclusion'],
    guidance:
      'Move descriptive prose to footnotes or surrounding text, reshape the table, or record why the table is excluded.'
  }
}

const MD_CALLOUT: RubricItem<MarkdownRubricContext> = {
  code: 'MD-callout',
  title: 'callouts use a supported GitHub alert deliberately',
  description:
    'A callout uses the concise GitHub alert form with one supported label (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, or `CAUTION`) and only for a contextual aside, not ordinary prose or a required instruction.',
  sources: ['standards-markdown.md#callouts'],
  judgment: {
    scope: 'Every authored Markdown callout.',
    prompt:
      'Assess whether callouts use supported GitHub alerts, remain concise, and are reserved for genuine contextual asides.',
    outcomes: ['conforming', 'rewrite required', 'remove required'],
    guidance:
      'Use a supported concise alert for a genuine aside, rewrite the content as ordinary prose, or remove the callout.'
  }
}

export const MARKDOWN: RubricFamily<AuthoringRubricContext, MarkdownRubricContext> = {
  code: 'MD',
  title: 'Markdown authoring',
  description: 'The mechanical Markdown gate and reviewer-applied Markdown conventions.',
  standard: 'standards-markdown.md',
  selectContext: (context: AuthoringRubricContext) => context.markdown,
  items: [MD_MECH, MD_FRONTMATTER, MD_TABLE, MD_FOOTNOTE, MD_LINK, MD_CELL_PROSE, MD_CALLOUT]
}
