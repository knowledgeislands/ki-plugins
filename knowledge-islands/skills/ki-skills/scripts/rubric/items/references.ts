import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { judgment } from '../../shared/rubric.ts'
import {
  type KiSkillsRubricContext,
  type ReferencesRubricContext,
  selectKiSkillsContext
} from '../contexts/contexts.ts'

const TOC_LINE_THRESHOLD = 100

const hasTableOfContents = (markdown: string): boolean => {
  const head = markdown.split(/\r?\n/).slice(0, 40).join('\n').toLowerCase()
  if (/^#{1,3}\s+(table of )?contents\b/m.test(head)) return true
  return (head.match(/^\s*[-*]\s+\[[^\]]+\]\(/gm) || []).length >= 3
}

const REF_1: RubricItem<ReferencesRubricContext> = {
  code: 'REF-1',
  title: 'rarely used detail is separated into on-demand files',
  description: 'Detailed/rarely-used material is in on-demand files; mutually-exclusive domains are split.',
  sources: ['BP', 'ENG', 'SPEC'],
  judgment: judgment(
    'Is detailed or rarely used material routed to on-demand files, with mutually exclusive domains split?'
  )
}

const REF_2: RubricItem<ReferencesRubricContext> = {
  code: 'REF-2',
  title: 'supporting files are referenced from SKILL.md with a loading cue',
  description: 'Every supporting file is referenced from `SKILL.md` with when-to-load — no orphans.',
  sources: ['BP', 'CC', 'SPEC'],
  judgment: judgment('Is every supporting file referenced from SKILL.md with clear guidance on when to load it?')
}

const REF_3: RubricItem<ReferencesRubricContext> = {
  code: 'REF-3',
  title: 'long reference files open with a table of contents',
  description: 'Reference files > 100 lines open with a table of contents.',
  sources: ['BP', 'COMMUNITY'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Author a concise table of contents near the top using the reference’s actual section structure and stable anchors.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ lineCount, content }) => [
        lineCount <= TOC_LINE_THRESHOLD
          ? {
              status: 'NOT_APPLICABLE',
              message: `${lineCount} lines; a table of contents is required only over ${TOC_LINE_THRESHOLD} lines`
            }
          : hasTableOfContents(content)
            ? { status: 'PASS', message: `${lineCount} lines with a table of contents near the top` }
            : { status: 'VIOLATION', message: `${lineCount} lines but no table of contents near the top` }
      ]
    }
  }
}

const REF_4: RubricItem<ReferencesRubricContext> = {
  code: 'REF-4',
  title: 'script execution intent is explicit',
  description: 'Execution intent is explicit per script (run vs read).',
  sources: ['BP', 'ENG'],
  judgment: judgment('Is the execution intent for each script explicit: run it or read it?')
}

const REF_5: RubricItem<ReferencesRubricContext> = {
  code: 'REF-5',
  title: 'many-moded skills route independently invoked procedures',
  description: `_Mode-router for many-moded skills._ A skill whose body is dominated by **independently-invoked** modes keeps the shared model + a dispatch table in \`SKILL.md\` and moves each mode's procedure to its own flat \`references/mode-<name>.md\`; combined mode files such as \`mode-audit-conform.md\` are split, and each procedure states its own preconditions. Behaviour anchors and the shared model stay in the body. Not required when modes are few, short, or call-chained.`,
  sources: ['BP', 'SPEC §8'],
  judgment: judgment(
    'Where this skill has many independently invoked modes, does SKILL.md retain the shared model and dispatch while flat mode files hold their procedures?'
  )
}

export const REFERENCES: RubricFamily<KiSkillsRubricContext, ReferencesRubricContext> = {
  code: 'REF',
  title: 'Progressive disclosure & references',
  description: 'How a skill routes supporting detail into references.',
  standard: 'standards-agent-skills.md#8-progressive-disclosure',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'references'),
  items: [REF_1, REF_2, REF_3, REF_4, REF_5]
}
