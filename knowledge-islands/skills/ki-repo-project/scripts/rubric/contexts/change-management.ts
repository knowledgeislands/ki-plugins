import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { ProjectRubricContext } from '../types.ts'

const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export const createProjectSession = ({ repository }: RubricContextOptions): RubricSession<ProjectRubricContext> => {
  const config = join(repository, '.ki-config.toml')
  let outcomes: AuditOutcome[]
  if (!existsSync(config))
    outcomes = [
      { status: 'NOT_APPLICABLE', message: 'No KI repository configuration is present.', subject: '.ki-config.toml' }
    ]
  else {
    try {
      const parsed = TOML.parse(readFileSync(config, 'utf8')) as { skills?: Record<string, unknown> }
      const skills = parsed.skills ?? {}
      const project = skills['ki-repo-project']
      const kb = skills['ki-repo-kb']
      outcomes = [
        ...(project && typeof project === 'object' && !Array.isArray(project)
          ? [
              {
                status: 'PASS' as const,
                message: 'Project primary structure is explicitly declared.',
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: '[skills.ki-repo-project] must declare Project primary structure.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(kb
          ? [
              {
                status: 'VIOLATION' as const,
                message: 'Project and Knowledge Base primary structures are mutually exclusive.',
                subject: '.ki-config.toml'
              }
            ]
          : [])
      ]
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
    }
  }
  return {
    subjects: [{ families: ['PRIMARY'], context: () => ({ primary: { outcomes } }) }],
    proposal: () => ({ writes: [] })
  }
}
