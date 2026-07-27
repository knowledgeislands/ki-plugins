import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { type KiSkillsRubricContext, type NameRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'
import { containsXmlTag } from '../contexts/text.ts'

const NAME_MAX_LENGTH = 64
const RESERVED_WORDS = ['anthropic', 'claude']

const NAME_1: RubricItem<NameRubricContext> = {
  code: 'NAME-1',
  title: 'name is present',
  description: '`name` present (spec requires it; CC defaults to dir name — see ※1).',
  sources: ['SPEC', 'CC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name }) =>
        !name ? [{ status: 'VIOLATION', message: '`name` is missing from frontmatter' }] : [{ status: 'PASS', message: 'name is present' }]
    }
  }
}

const NAME_2: RubricItem<NameRubricContext> = {
  code: 'NAME-2',
  title: 'name is no longer than 64 characters',
  description: '`name` ≤ 64 characters.',
  sources: ['SPEC', 'BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name }) =>
        !name
          ? [{ status: 'NOT_APPLICABLE', message: 'name is not present' }]
          : name.length > NAME_MAX_LENGTH
            ? [{ status: 'VIOLATION', message: `\`name\` is ${name.length} chars (max ${NAME_MAX_LENGTH})` }]
            : [{ status: 'PASS', message: 'name is no longer than 64 characters' }]
    }
  }
}

const NAME_3: RubricItem<NameRubricContext> = {
  code: 'NAME-3',
  title: 'name uses lowercase letters, digits, and hyphens only',
  description: '`name` is lowercase letters, digits, hyphens only.',
  sources: ['SPEC', 'BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name }) =>
        !name
          ? [{ status: 'NOT_APPLICABLE', message: 'name is not present' }]
          : !/^[a-z0-9-]+$/.test(name)
            ? [{ status: 'VIOLATION', message: `\`name\` "${name}" must be lowercase letters, digits, and hyphens only` }]
            : [{ status: 'PASS', message: 'name uses lowercase letters, digits, and hyphens only' }]
    }
  }
}

const NAME_4: RubricItem<NameRubricContext> = {
  code: 'NAME-4',
  title: 'name has no leading or trailing hyphen and no consecutive hyphens',
  description: '`name` has no leading/trailing hyphen and no consecutive hyphens.',
  sources: ['SPEC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name }) =>
        !name
          ? [{ status: 'NOT_APPLICABLE', message: 'name is not present' }]
          : name.startsWith('-') || name.endsWith('-') || name.includes('--')
            ? [{ status: 'VIOLATION', message: `\`name\` "${name}" must not start/end with a hyphen or contain "--"` }]
            : [{ status: 'PASS', message: 'name has no leading or trailing hyphen and no consecutive hyphens' }]
    }
  }
}

const NAME_5: RubricItem<NameRubricContext> = {
  code: 'NAME-5',
  title: 'name matches the parent directory name exactly',
  description:
    '`name` matches the parent directory name exactly. The committed repository-local source is `.agents/skills/ki-self/`, whose required name is `ki-self`.',
  sources: ['SPEC'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name, directoryName, localGovernanceSource }) =>
        !name
          ? [{ status: 'NOT_APPLICABLE', message: 'name is not present' }]
          : name !== directoryName
            ? [{ status: 'VIOLATION', message: `\`name\` "${name}" does not match the directory name "${directoryName}"` }]
            : [
                {
                  status: 'PASS',
                  message: localGovernanceSource
                    ? 'name matches the canonical repository-local `.agents/skills/ki-self/` source name'
                    : 'name matches the parent directory name exactly'
                }
              ]
    },
    conform: {
      phase: 'NORMALISE',
      run: ({ name, directoryName, setName }) => {
        if (name && name !== directoryName) setName?.(directoryName)
      }
    }
  }
}

const NAME_6: RubricItem<NameRubricContext> = {
  code: 'NAME-6',
  title: 'name contains no XML tags or reserved words',
  description: '`name` contains no XML tags and no reserved words (`anthropic`, `claude`).',
  sources: ['BP'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ name }) => {
        if (!name) return [{ status: 'NOT_APPLICABLE', message: 'name is not present' }]
        const violations = containsXmlTag(name) ? [{ status: 'VIOLATION' as const, message: '`name` contains an XML tag' }] : []
        for (const word of RESERVED_WORDS)
          if (name.includes(word)) violations.push({ status: 'VIOLATION', message: `\`name\` contains the reserved word "${word}"` })
        return violations.length > 0
          ? [violations[0] as (typeof violations)[number], ...violations.slice(1)]
          : [{ status: 'PASS', message: 'name contains no XML tags or reserved words' }]
      }
    }
  }
}

const NAME_7: RubricItem<NameRubricContext> = {
  code: 'NAME-7',
  title: 'name is specific rather than generic',
  description: '`name` is specific, not generic (avoid `helper`, `utils`, `tools`, `data`).',
  sources: ['BP'],
  judgment: { prompt: 'Is this name concrete and appropriately scoped for the capability it governs?' }
}

export const NAME: RubricFamily<KiSkillsRubricContext, NameRubricContext> = {
  code: 'NAME',
  title: 'Frontmatter: name',
  description: 'The portable skill name contract.',
  standard: 'standards-agent-skills.md#4-frontmatter-name',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'name'),
  items: [NAME_1, NAME_2, NAME_3, NAME_4, NAME_5, NAME_6, NAME_7]
}
