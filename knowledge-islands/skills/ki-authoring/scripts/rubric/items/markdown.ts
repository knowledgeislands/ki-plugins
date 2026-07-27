import type { RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, MarkdownRubricContext } from '../contexts/authoring.ts'

const markdownMechanicalAudit = (
  context: MarkdownRubricContext
): RubricOutcomes<{
  status: 'PASS' | 'VIOLATION'
  message: string
  subject: string
}> => {
  if (!context.exists) return [{ status: 'VIOLATION', message: 'audit target is missing or is not a directory', subject: context.target }]
  return context.audit.clean
    ? [{ status: 'PASS', message: 'Prettier + markdownlint clean', subject: context.target }]
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
    '`ki repo audit --skill ki-authoring` passes: prose is unwrapped; bullet and quote characters, heading hierarchy, a single H1, spacing, table alignment, resolved links and references, no bare URLs, and descriptive link text satisfy Prettier and markdownlint-cli2, which run directly inside the audit.',
  sources: ['standards-authoring.md#markdown-gate', 'standards-markdown.md#what-to-leave-to-the-linter'],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: markdownMechanicalAudit },
    conform: {
      phase: 'NORMALISE',
      run: (context) => {
        context.normalise?.()
      }
    }
  }
}

const MD_TABLE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-table',
  title: 'wide tables are reshaped',
  description:
    'A table with rows that would exceed `printWidth` (160 chars) is reshaped into subheadings or a bulleted definition list; genuinely tabular data with one long column keeps the table and moves that column to footnotes below it.',
  sources: ['standards-markdown.md#tables-and-footnotes'],
  judgment: { prompt: 'Are wide or prose-heavy tables reshaped according to the Markdown convention?' }
}

const MD_FOOTNOTE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-footnote',
  title: 'table footnotes use the house marker series',
  description:
    'Footnotes use the marker series `† ‡ § ¶ ‖` (then doubled), reset per table, with a distinct second series `※ ❡ ¤ ¥` where needed; each footnote is a separate paragraph.',
  sources: ['standards-markdown.md#footnote-marker-series'],
  judgment: { prompt: 'Do table footnotes use the documented marker series and paragraph layout?' }
}

const MD_LINK: RubricItem<MarkdownRubricContext> = {
  code: 'MD-link',
  title: 'house-file links are descriptive and portable',
  description:
    'House-file links are descriptive relative Markdown links rather than wikilinks; paths with spaces use angle brackets. KB note content and agent prompts remain explicitly scoped exceptions.',
  sources: ['standards-markdown.md#links'],
  judgment: { prompt: 'Are the links descriptive, relative Markdown links where this convention applies?' }
}

const MD_CELL_PROSE: RubricItem<MarkdownRubricContext> = {
  code: 'MD-cell-prose',
  title: 'tables avoid descriptive prose in cells',
  description: 'Tables avoid long descriptive prose in cells — that is the footnote’s job.',
  sources: ['standards-markdown.md#keeping-tables-skimmable'],
  judgment: { prompt: 'Do table cells avoid long descriptive prose?' }
}

const MD_CALLOUT: RubricItem<MarkdownRubricContext> = {
  code: 'MD-callout',
  title: 'callouts use a supported GitHub alert deliberately',
  description:
    'A callout uses the concise GitHub alert form with one supported label (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, or `CAUTION`) and only for a contextual aside, not ordinary prose or a required instruction.',
  sources: ['standards-markdown.md#callouts'],
  judgment: { prompt: 'Are callouts supported GitHub alerts, concise, and reserved for genuine contextual asides?' }
}

export const MARKDOWN: RubricFamily<AuthoringRubricContext, MarkdownRubricContext> = {
  code: 'MD',
  title: 'Markdown authoring',
  description: 'The mechanical Markdown gate and reviewer-applied Markdown conventions.',
  standard: 'standards-markdown.md',
  selectContext: (context: AuthoringRubricContext) => context.markdown,
  items: [MD_MECH, MD_TABLE, MD_FOOTNOTE, MD_LINK, MD_CELL_PROSE, MD_CALLOUT]
}
