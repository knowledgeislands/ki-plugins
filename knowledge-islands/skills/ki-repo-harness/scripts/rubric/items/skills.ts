import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessRubricContext, HarnessSkillsContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#skill-capability-identity'] as const

const unavailable = (context: HarnessSkillsContext): readonly AuditOutcome[] | null => {
  if (context.repositoryState !== 'physical')
    return [
      {
        status: 'NOT_APPLICABLE',
        message: 'The source harness is not safely inspectable.',
        subject: context.repository
      }
    ]
  if (context.skillsState === 'missing')
    return [{ status: 'NOT_APPLICABLE', message: 'The skills/ shelf is absent.', subject: 'skills/' }]
  if (context.skillsState !== 'directory')
    return [{ status: 'VIOLATION', message: 'The skills/ shelf is not a physical directory.', subject: 'skills/' }]
  if (context.unsafePaths.length)
    return context.unsafePaths.map((path) => ({
      status: 'VIOLATION',
      message: 'Unsafe or unreadable skill evidence was not traversed.',
      subject: path
    }))
  return null
}

const SKILLS_1: RubricItem<HarnessSkillsContext> = {
  code: 'SKILLS-1',
  title: 'Skill directory and name alignment',
  description: 'Each discovered physical skill root matches its SKILL.md name frontmatter.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the affected skill directory or frontmatter identity, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked)
          return blocked.map((outcome) =>
            outcome.status === 'VIOLATION' ? { ...outcome, level: 'WARN' as const } : outcome
          )
        if (!context.skills.length)
          return [{ status: 'PASS', message: 'No skill roots require name alignment.', subject: 'skills/' }]
        return context.skills.map((skill) =>
          skill.declaredName === null
            ? {
                status: 'VIOLATION',
                level: 'WARN',
                message: 'The skill has no parseable name frontmatter.',
                subject: `${skill.path}/SKILL.md`
              }
            : {
                status: skill.declaredName === skill.directory ? 'PASS' : 'VIOLATION',
                message: `Directory '${skill.directory}' must match name '${skill.declaredName}'.`,
                subject: skill.path
              }
        )
      }
    }
  }
}

const SKILLS_2: RubricItem<HarnessSkillsContext> = {
  code: 'SKILLS-2',
  title: 'Unique skill names',
  description: 'No two discovered skill roots share a frontmatter name.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Resolve the duplicate published name within the source Harness, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked) return blocked
        const names = new Map<string, string[]>()
        for (const skill of context.skills) {
          if (!skill.declaredName) continue
          names.set(skill.declaredName, [...(names.get(skill.declaredName) ?? []), skill.path])
        }
        const duplicates = [...names.entries()].filter(([, paths]) => paths.length > 1)
        return duplicates.length
          ? duplicates.map(([name, paths]) => ({
              status: 'VIOLATION',
              message: `Duplicate name '${name}' appears in ${paths.join(', ')}.`,
              subject: 'skills/'
            }))
          : [{ status: 'PASS', message: 'Discovered skill names are unique.', subject: 'skills/' }]
      }
    }
  }
}

const SKILLS_3: RubricItem<HarnessSkillsContext> = {
  code: 'SKILLS-3',
  title: 'Prefix-owned skill names',
  description: 'Every published skill name begins with the Harness capability prefix.',
  sources: STANDARD,
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Align the published skill identity with the owner-approved Harness prefix.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const blocked = unavailable(context)
        if (blocked) return blocked
        if (context.prefix === null)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'The Harness capability prefix is absent or invalid.',
              subject: '.ki-config.toml'
            }
          ]
        const mismatches = context.skills.filter(
          (skill) => skill.declaredName !== null && !skill.declaredName.startsWith(`${context.prefix}-`)
        )
        return mismatches.length
          ? mismatches.map((skill) => ({
              status: 'VIOLATION',
              message: `Skill name '${skill.declaredName}' must begin with '${context.prefix}-'.`,
              subject: `${skill.path}/SKILL.md`
            }))
          : [
              {
                status: 'PASS',
                message: `Published skill names use the '${context.prefix}-' capability prefix.`,
                subject: 'skills/'
              }
            ]
      }
    }
  }
}

export const SKILLS: RubricFamily<HarnessRubricContext, HarnessSkillsContext> = {
  code: 'SKILLS',
  title: 'Skill capability identity',
  description: 'Recursive physical skill discovery and identity integrity within the compatible payload.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.skills,
  items: [SKILLS_1, SKILLS_2, SKILLS_3]
}
