import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { judgment } from '../../shared/rubric.ts'
import {
  type DescriptionRubricContext,
  type KiSkillsRubricContext,
  selectKiSkillsContext
} from '../contexts/contexts.ts'
import { containsXmlTag, stripCode } from '../contexts/text.ts'

const DESCRIPTION_MAX_LENGTH = 1024

const DESC_1: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-1',
  title: 'description is present and non-empty',
  description: '`description` present and non-empty.',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Author a truthful description that states the skill scope and when to select it; the intended capability cannot be inferred safely from an empty value.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ description }) =>
        !description || description.trim() === ''
          ? [{ status: 'VIOLATION', message: '`description` is missing or empty' }]
          : [{ status: 'PASS', message: 'description is present and non-empty' }]
    }
  }
}

const DESC_2: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-2',
  title: 'description is no longer than 1024 characters',
  description: '`description` ≤ 1024 characters (spec hard cap — see ※2).',
  sources: ['SPEC', 'BP'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Shorten the description below the hard cap while preserving its scope, primary triggers, and essential collision guidance.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ description }) =>
        !description
          ? [{ status: 'NOT_APPLICABLE', message: 'description is not present' }]
          : description.length > DESCRIPTION_MAX_LENGTH
            ? [
                {
                  status: 'VIOLATION',
                  message: `\`description\` is ${description.length} chars (max ${DESCRIPTION_MAX_LENGTH})`
                }
              ]
            : [{ status: 'PASS', message: 'description is no longer than 1024 characters' }]
    }
  }
}

const DESC_3: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-3',
  title: 'description contains no XML tags',
  description: '`description` contains no XML tags (placeholders inside backticks are fine).',
  sources: ['BP'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Rewrite or escape the XML-like text while preserving the author’s intended meaning and any literal placeholder syntax.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ description }) =>
        !description
          ? [{ status: 'NOT_APPLICABLE', message: 'description is not present' }]
          : containsXmlTag(stripCode(description))
            ? [{ status: 'VIOLATION', message: '`description` contains an XML tag' }]
            : [{ status: 'PASS', message: 'description contains no XML tags' }]
    }
  }
}

const DESC_4: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-4',
  title: 'description states what the skill does and when to use it',
  description: 'States **both** what it does **and** when to use it.',
  sources: ['SPEC', 'BP'],
  judgment: judgment('Does the description state both what this skill does and when it should be used?')
}

const DESC_5: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-5',
  title: 'description is written in the third person',
  description: 'Written in the **third person**, never first/second person.',
  sources: ['BP', 'COMMUNITY'],
  judgment: judgment('Is the description consistently written in the third person?')
}

const DESC_6: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-6',
  title: 'description includes concrete trigger phrases',
  description: 'Includes concrete **trigger keywords/phrases** a user would say.',
  sources: ['SPEC', 'BP', 'CC'],
  judgment: judgment('Does the description include concrete trigger phrases a user would say?')
}

const DESC_7: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-7',
  title: 'description leans toward firing and front-loads its main trigger',
  description: 'Leans toward firing, and front-loads the most important trigger.',
  sources: ['ENG', 'COMMUNITY', 'CC'],
  judgment: judgment(
    'Does the description lean toward appropriate selection and front-load its most important trigger?'
  )
}

const DESC_8: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-8',
  title: 'description avoids vague phrasing',
  description: 'Avoids vague phrasing ("helps with documents").',
  sources: ['SPEC', 'BP'],
  judgment: judgment('Does the description avoid vague phrases such as "helps with documents"?')
}

const DESC_9: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-9',
  title: 'description may state explicit non-triggers where collision is likely',
  description: '_(Advanced)_ Where collision is likely, may end with explicit non-triggers.',
  sources: ['COMMUNITY'],
  judgment: judgment('Where skill-selection collision is likely, would explicit non-triggers improve routing?')
}

const DESC_10: RubricItem<DescriptionRubricContext> = {
  code: 'DESC-10',
  title: 'description earns its standing cost through routing value',
  description:
    'The description retains scope, its primary trigger, and essential collision guidance while routing mode and workflow detail out of the standing surface.',
  sources: ['KI'],
  judgment: judgment(
    'Does the description earn its standing source cost by retaining scope, its primary trigger, and only essential collision guidance while routing mode and workflow detail out?'
  )
}

export const DESC: RubricFamily<KiSkillsRubricContext, DescriptionRubricContext> = {
  code: 'DESC',
  title: 'Frontmatter: description',
  description: 'The portable skill description contract.',
  standard: 'standards-agent-skills.md#5-frontmatter-description',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'description'),
  items: [DESC_1, DESC_2, DESC_3, DESC_4, DESC_5, DESC_6, DESC_7, DESC_8, DESC_9, DESC_10]
}
