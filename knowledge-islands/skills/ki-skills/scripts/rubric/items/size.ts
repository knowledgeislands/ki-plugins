import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, type SizeRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const BODY_MAX_LINES = 500
const BODY_MAX_TOKENS = 5000

const SIZE_1: RubricItem<SizeRubricContext> = {
  code: 'SIZE-1',
  title: 'body is under 500 lines',
  description: '`SKILL.md` body is under **500 lines**.',
  sources: ['SPEC', 'BP', 'CC'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ bodyLines }) => {
        if (bodyLines === undefined) return [{ status: 'NOT_APPLICABLE', message: 'SKILL.md body line count is unavailable' }]
        return bodyLines > BODY_MAX_LINES
          ? [
              {
                status: 'VIOLATION',
                message: `SKILL.md body is ${bodyLines} lines (recommended < ${BODY_MAX_LINES}) — split into references/`
              }
            ]
          : [{ status: 'PASS', message: 'body is under 500 lines' }]
      }
    }
  }
}

const SIZE_2: RubricItem<SizeRubricContext> = {
  code: 'SIZE-2',
  title: 'body stays below approximately 5,000 tokens',
  description: 'Body instructions stay under **~5,000 tokens**.',
  sources: ['SPEC'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ bodyTokens }) => {
        if (bodyTokens === undefined) return [{ status: 'NOT_APPLICABLE', message: 'SKILL.md body token count is unavailable' }]
        return bodyTokens > BODY_MAX_TOKENS
          ? [{ status: 'VIOLATION', message: `SKILL.md body is ~${bodyTokens} tokens (recommended < ${BODY_MAX_TOKENS})` }]
          : [{ status: 'PASS', message: 'body stays below approximately 5,000 tokens' }]
      }
    }
  }
}

const SIZE_3: RubricItem<SizeRubricContext> = {
  code: 'SIZE-3',
  title: 'body omits knowledge the agent already has',
  description: 'No token spent on what a competent agent already knows.',
  sources: ['BP'],
  judgment: { prompt: 'Does the body avoid spending tokens on knowledge a competent agent already has?' }
}

const SIZE_4: RubricItem<SizeRubricContext> = {
  code: 'SIZE-4',
  title: 'body is an overview that routes to detail',
  description: '`SKILL.md` reads as an **overview that routes to detail**, not all detail inlined.',
  sources: ['BP', 'SPEC', 'CC'],
  judgment: { prompt: 'Does the body work as an overview that routes rarely used detail into supporting files?' }
}

export const SIZE: RubricFamily<KiSkillsRubricContext, SizeRubricContext> = {
  code: 'SIZE',
  title: 'Body: size & conciseness',
  description: 'The progressive-disclosure budget for a skill body.',
  standard: 'standards-agent-skills.md#7-size--conciseness',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'size'),
  items: [SIZE_1, SIZE_2, SIZE_3, SIZE_4]
}
