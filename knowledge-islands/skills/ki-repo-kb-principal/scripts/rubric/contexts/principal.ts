import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const REQUIRED = [
  'Admin/MEMORY.md',
  'Admin/Governance/Charter.md',
  'Admin/Governance/Known Lands.md',
  'Admin/Governance/Conventions/Conventions.md',
  'Admin/Operations/Processes/Enactment Process.md'
] as const

export type PrincipalContext = {
  readonly rubric: RubricPublicationContext
  readonly missing: readonly string[]
  readonly enactmentAnchor: boolean
}

const regular = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

export const createPrincipalSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<PrincipalContext> => {
  const root = resolve(repository)
  const orientation = ['CLAUDE.md', 'AGENTS.md']
    .filter((file) => regular(join(root, file)))
    .map((file) => readFileSync(join(root, file), 'utf8'))
    .join('\n')
  const context: PrincipalContext = {
    rubric: { publication },
    missing: REQUIRED.filter((path) => !regular(join(root, path))),
    enactmentAnchor: /Enactment Process|enactment gate/i.test(orientation)
  }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['PRINCIPAL'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
