import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createGitHubIssuesSession } from '../contexts/change-management.ts'
import type { GitHubIssuesRubricContext } from '../types.ts'
import { MAP } from './mapping.ts'
import { SELECT } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-work-github-issues',
  concern: 'GitHub Issues change-management adapter',
  createSession: createGitHubIssuesSession,
  families: [SELECT, MAP]
} satisfies SkillRubricDefinition<GitHubIssuesRubricContext>
