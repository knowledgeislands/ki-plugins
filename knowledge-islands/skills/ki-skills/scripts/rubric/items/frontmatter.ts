import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type FrontmatterRubricContext, type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const FM_1: RubricItem<FrontmatterRubricContext> = {
  code: 'FM-1',
  title: 'SKILL.md begins with a valid YAML frontmatter mapping',
  description:
    '`SKILL.md` begins with a fenced YAML frontmatter block that parses to a mapping. Without it, dependent frontmatter checks do not run.',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ hasBlock, isMapping }) => {
        if (!hasBlock) return [{ status: 'VIOLATION', message: 'SKILL.md must begin with a YAML frontmatter block (--- ... ---)' }]
        if (!isMapping) return [{ status: 'VIOLATION', message: 'YAML frontmatter must parse to a mapping' }]
        return [{ status: 'PASS', message: 'SKILL.md begins with a valid YAML frontmatter mapping' }]
      }
    }
  }
}

export const FRONTMATTER: RubricFamily<KiSkillsRubricContext, FrontmatterRubricContext> = {
  code: 'FM',
  title: 'Frontmatter document',
  description: 'The YAML frontmatter document that identifies a skill.',
  standard: 'standards-agent-skills.md#3-frontmatter-document',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'frontmatter'),
  items: [FM_1]
}
