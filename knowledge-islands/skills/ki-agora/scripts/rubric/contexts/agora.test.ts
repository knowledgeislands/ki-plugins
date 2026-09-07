import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { CONFIG } from '../items/configuration.ts'
import { MEMBERSHIP } from '../items/memberships.ts'
import { createAgoraSession } from './agora.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-agora-'))
  temporaryDirectories.push(root)
  writeFileSync(
    join(root, '.ki.toml'),
    ['[skills.ki-repo]', 'repository = "https://github.com/knowledgeislands/home"', ''].join('\n')
  )
  return root
}

const options = (repository: string, configuration: Record<string, unknown>): RubricContextOptions => ({
  mode: 'audit',
  repository,
  userHome: repository,
  configuration
})

const outcomes = <Family extends typeof CONFIG | typeof MEMBERSHIP>(
  session: ReturnType<typeof createAgoraSession>,
  family: Family
) => {
  const item = family.items[0]
  if (!item?.mechanical) throw new Error(`${family.code} has no mechanical item`)
  return item.mechanical.audit.run(family.selectContext(session.subjects[1]?.context() as never) as never)
}

test('canonical home and membership declarations pass local shape validation', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      homes: {
        'knowledge-islands': {
          owner: 'https://github.com/knowledgeislands/home',
          purpose: 'Knowledge Islands maintained repositories',
          order: [
            'https://github.com/knowledgeislands/tools-ki',
            'https://github.com/example/plain-git-repository',
            'https://github.com/knowledgeislands/home'
          ],
          references: ['https://github.com/example/plain-git-repository'],
          members: { 'https://github.com/knowledgeislands/tools-ki': 'maintainer' }
        }
      },
      memberships: {
        'knowledge-islands': {
          home: 'https://github.com/knowledgeislands/ki-agentic-harness',
          role: 'maintainer'
        }
      }
    })
  )

  expect(outcomes(session, CONFIG)).toEqual([
    {
      status: 'PASS',
      message: 'Agora homes use canonical owner identity, purpose, ordered projection, and approved member shape.'
    }
  ])
  expect(outcomes(session, MEMBERSHIP)).toEqual([
    { status: 'PASS', message: 'Agora memberships use canonical home and role shape.' }
  ])
})

test('local shape rejects malformed declarations without observing a peer', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      homes: {
        Knowledge_Islands: {
          owner: 'not a repository',
          purpose: '',
          members: {
            'not a repository': 'not a role',
            'https://github.com/knowledgeislands/home': 'owner'
          }
        }
      },
      memberships: { 'knowledge-islands': { home: 'not a repository', role: 'not a role', extra: true } }
    })
  )

  expect(outcomes(session, CONFIG).map((outcome) => outcome.message)).toEqual([
    'home Knowledge_Islands must use a stable lower-case hyphenated identifier',
    'home Knowledge_Islands owner must be a canonical HTTPS GitHub repository',
    'home Knowledge_Islands requires a non-empty purpose',
    'home Knowledge_Islands member not a repository must be a canonical HTTPS GitHub repository',
    'home Knowledge_Islands member not a repository role must be a lower-case hyphenated identifier',
    'home Knowledge_Islands must not list its own repository as a member'
  ])
  expect(outcomes(session, MEMBERSHIP)).toContainEqual({
    status: 'VIOLATION',
    message: 'membership knowledge-islands has unrecognised key extra',
    subject: '.ki.toml'
  })
  expect(outcomes(session, MEMBERSHIP).map((outcome) => outcome.message)).toContain(
    'membership knowledge-islands home must be a canonical HTTPS GitHub repository'
  )
})

test('unknown fields fail closed and a local declaration never becomes reciprocal consent', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      target_policy: ['editor'],
      homes: {
        team: {
          owner: 'https://github.com/knowledgeislands/home',
          purpose: 'Team work',
          members: {},
          target_policy: ['editor']
        }
      }
    })
  )

  expect(outcomes(session, CONFIG)).toEqual(
    expect.arrayContaining([
      {
        status: 'VIOLATION',
        message: 'unrecognised ki-agora configuration key target_policy',
        subject: '.ki.toml'
      },
      {
        status: 'VIOLATION',
        message: 'home team has unrecognised key target_policy',
        subject: '.ki.toml'
      }
    ])
  )
})

test('ordered projection is a duplicate-free prefix of the declared participants', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      homes: {
        team: {
          owner: 'https://github.com/knowledgeislands/home',
          purpose: 'Team work',
          order: [
            'https://github.com/knowledgeislands/tools-ki',
            'https://github.com/knowledgeislands/tools-ki',
            'https://github.com/knowledgeislands/unknown'
          ],
          members: { 'https://github.com/knowledgeislands/tools-ki': 'maintainer' }
        }
      }
    })
  )

  expect(outcomes(session, CONFIG).map((outcome) => outcome.message)).toEqual([
    'home team order repeats https://github.com/knowledgeislands/tools-ki',
    'home team order repository https://github.com/knowledgeislands/unknown must name its owner, member, or reference'
  ])
})

test('external references are canonical, unique, non-member, and owner-selected', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      homes: {
        team: {
          owner: 'https://github.com/knowledgeislands/home',
          purpose: 'Team work',
          references: [
            'not a repository',
            'https://github.com/knowledgeislands/home',
            'https://github.com/knowledgeislands/tools-ki',
            'https://github.com/knowledgeislands/tools-ki'
          ],
          members: { 'https://github.com/knowledgeislands/tools-ki': 'maintainer' }
        }
      }
    })
  )

  expect(outcomes(session, CONFIG).map((outcome) => outcome.message)).toEqual([
    'home team references entries must be canonical HTTPS GitHub repositories',
    'home team must not reference its own repository',
    'home team repository https://github.com/knowledgeislands/tools-ki must not be both a member and reference',
    'home team references repeats https://github.com/knowledgeislands/tools-ki',
    'home team repository https://github.com/knowledgeislands/tools-ki must not be both a member and reference'
  ])
})

test('local shape requires each home to name its declaring owner', () => {
  const root = fixture()
  const session = createAgoraSession(
    options(root, {
      homes: {
        team: {
          owner: 'https://github.com/knowledgeislands/other',
          purpose: 'Team work',
          members: {}
        }
      }
    })
  )

  expect(outcomes(session, CONFIG)).toContainEqual({
    status: 'VIOLATION',
    message: 'home team owner must match its declaring repository',
    subject: '.ki.toml'
  })
})
