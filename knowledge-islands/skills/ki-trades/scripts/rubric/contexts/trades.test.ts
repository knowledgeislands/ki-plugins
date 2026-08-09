import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { AUTH } from '../items/authority.ts'
import { CONFIG } from '../items/configuration.ts'
import { RECORD } from '../items/records.ts'
import { RELEASE } from '../items/release.ts'
import { ROUTE } from '../items/routes.ts'
import { SCAFFOLD } from '../items/scaffold.ts'
import { STATUS } from '../items/status.ts'
import { createTradesSession, tradeReadmes } from './trades.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const repositoryUrl = (identity: string): string => `https://github.com/${identity}`
// Routes are declared partner-first, so a fixture names each peer once carrying both directions.
const routes = (
  peers: readonly string[],
  kinds: readonly ('work' | 'knowledge')[] = ['work', 'knowledge']
): Record<string, unknown> =>
  Object.fromEntries(peers.map((peer) => [peer, { export: [...kinds], import: [...kinds] }]))

const tradeConfiguration = (
  _identity: string,
  peers: readonly string[],
  kinds?: readonly ('work' | 'knowledge')[]
): Record<string, unknown> => ({ routes: routes(peers, kinds) })

const writeRepositoryConfiguration = (
  root: string,
  identity: string,
  peers: readonly string[],
  kinds?: readonly ('work' | 'knowledge')[]
): void => {
  writeFileSync(
    join(root, '.ki-config.toml'),
    [
      '[skills.ki-repo]',
      `repository = ${JSON.stringify(repositoryUrl(identity))}`,
      '',
      '[skills.ki-trades]',
      '',
      '[skills.ki-trades.routes]',
      ...peers.map((peer) => `${JSON.stringify(peer)} = ${JSON.stringify(routes([peer], kinds)[peer])}`),
      ''
    ].join('\n')
  )
}

const scaffold = (root: string): void => {
  mkdirSync(join(root, '+'), { recursive: true })
  mkdirSync(join(root, '-'), { recursive: true })
  for (const readme of tradeReadmes) {
    mkdirSync(join(root, readme.path, '..'), { recursive: true })
    writeFileSync(join(root, readme.path), readme.content)
  }
}

const registry = (home: string, roots: readonly string[]): void => {
  const directory = join(home, '.config', 'ki')
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'config.toml'),
    ['[repositories]', `paths = [${roots.map((root) => JSON.stringify(root)).join(', ')}]`, ''].join('\n')
  )
}

const fixture = (peerIdentity = 'peer/repo', reciprocal = true) => {
  const home = temporaryDirectory('ki-trades-home-')
  const local = temporaryDirectory('ki-trades-local-')
  const peer = temporaryDirectory('ki-trades-peer-')
  scaffold(local)
  scaffold(peer)
  writeRepositoryConfiguration(local, 'local/repo', ['peer/repo'])
  writeRepositoryConfiguration(peer, peerIdentity, reciprocal ? ['local/repo'] : [])
  registry(home, [local, peer])
  return { home, local, peer }
}

const options = (
  repository: string,
  userHome: string,
  configuration: Record<string, unknown>,
  mode: 'audit' | 'conform' = 'audit'
): RubricContextOptions => ({
  mode,
  repository,
  userHome,
  configuration
})

const record = (
  id: string,
  sender: string,
  receiver: string,
  receiverFields: readonly string[] = [],
  submission = 'Please consider the proposed local outcome.',
  kind: 'work' | 'knowledge' = 'work',
  observation: 'unattended' | 'receipt' | 'decision' | 'completion' | undefined = 'decision',
  preparing = false
): string =>
  [
    '---',
    `id: ${id}`,
    "title: 'Submission title'",
    "created_at: '2026-08-03T12:00:00Z'",
    `sender: ${sender}`,
    `receiver: ${receiver}`,
    `kind: ${kind}`,
    'source_ref: KI-SOURCE-FND-001',
    ...(observation ? [`observation: ${observation}`] : []),
    ...(preparing ? ['phase: preparing'] : []),
    ...receiverFields,
    '---',
    '',
    `# ${id}: Submission title`,
    '',
    '## Context',
    '',
    'The sender has relevant originating evidence.',
    '',
    '## Submission',
    '',
    submission,
    '',
    '## Constraints',
    '',
    'The receiver retains roadmap, priority, implementation, and acceptance authority.',
    ''
  ].join('\n')

/** A record declares the phase of the copy it is; the fixture supplies the resting value unless a test states one. */
const writeRecord = (root: string, direction: '+' | '-', peerIdentity: string, id: string, content: string): void => {
  const directory = join(root, direction, '_TRADES', ...peerIdentity.split('/'))
  mkdirSync(directory, { recursive: true })
  const phased = /^phase: /m.test(content)
    ? content
    : content.replace('\n---\n', `\nphase: ${direction === '+' ? 'received' : 'submitted'}\n---\n`)
  writeFileSync(join(directory, `${id}.md`), phased)
}

const mechanicalOutcomes = (
  session: ReturnType<typeof createTradesSession>,
  family: typeof CONFIG | typeof ROUTE | typeof SCAFFOLD | typeof RECORD | typeof AUTH | typeof STATUS | typeof RELEASE,
  code?: string
) => {
  const item = code ? family.items.find((candidate) => candidate.code === code) : family.items[0]
  if (!item?.mechanical) throw new Error(`${family.code} has no mechanical item ${code ?? ''}`)
  return item.mechanical.audit.run(family.selectContext(session.subjects[0]?.context() as never) as never)
}

// Partner uniqueness and ordering are no longer checked here — TOML rejects a repeated key itself,
// and a map has no order. What remains checkable is the shape of each partner's own declaration.
test('malformed route declarations are refused', () => {
  const { home, local } = fixture()
  const session = createTradesSession(
    options(local, home, {
      routes: {
        'not a repository': { export: ['work'] },
        'peer/repo': { export: [], import: ['work', 'work'] },
        'another/repo': { export: ['gossip'] },
        'third/repo': 'work'
      }
    })
  )
  const messages = mechanicalOutcomes(session, CONFIG).map((outcome) => outcome.message)

  expect(messages).toContain(
    'route not a repository must be keyed by owner/name or a canonical HTTPS GitHub repository URL'
  )
  expect(messages).toContain('route peer/repo export carries no kinds and must be omitted rather than empty')
  expect(messages).toContain('route peer/repo import must not repeat a kind')
  expect(messages).toContain('route another/repo export kind gossip is not a declared trade kind')
  expect(messages).toContain('route third/repo must be a table declaring export and import kinds')
})

test('declared routes remain pending until the other repository registers and reciprocates', () => {
  const mismatch = fixture('peer/other')
  const mismatchSession = createTradesSession(
    options(mismatch.local, mismatch.home, tradeConfiguration('local/repo', ['peer/repo']))
  )
  expect(mechanicalOutcomes(mismatchSession, ROUTE)).toContainEqual({
    status: 'INFO',
    message: 'declared export route https://github.com/peer/repo awaits receiver registration',
    subject: 'https://github.com/peer/repo'
  })

  const oneSided = fixture('peer/repo', false)
  const oneSidedSession = createTradesSession(
    options(oneSided.local, oneSided.home, tradeConfiguration('local/repo', ['peer/repo']))
  )
  expect(mechanicalOutcomes(oneSidedSession, ROUTE)).toContainEqual({
    status: 'INFO',
    message: 'declared export route https://github.com/peer/repo awaits matching receiver declaration',
    subject: 'https://github.com/peer/repo'
  })
})

test('a route is active only for a kind that both repositories declare', () => {
  const { home, local, peer } = fixture()
  writeRepositoryConfiguration(peer, 'peer/repo', ['local/repo'], ['work'])
  const session = createTradesSession(
    options(local, home, tradeConfiguration('local/repo', ['peer/repo'], ['knowledge']))
  )

  expect(mechanicalOutcomes(session, ROUTE)).toContainEqual({
    status: 'INFO',
    message: 'declared export route https://github.com/peer/repo awaits matching receiver declaration',
    subject: 'https://github.com/peer/repo'
  })
})

test('outbound records are valid on a declared export route while receiver participation is pending', () => {
  const { home, local, peer } = fixture('peer/repo', false)
  const id = 'TRD-000000aa'
  writeRecord(local, '-', 'peer/repo', id, record(id, 'local/repo', 'peer/repo'))
  writeFileSync(
    join(peer, '.ki-config.toml'),
    ['[skills.ki-repo]', 'repository = "https://github.com/peer/repo"', ''].join('\n')
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, ROUTE)).toContainEqual({
    status: 'INFO',
    message: 'declared export route https://github.com/peer/repo awaits receiver ki-trades participation',
    subject: 'https://github.com/peer/repo'
  })
  expect(mechanicalOutcomes(session, AUTH)).toEqual([
    { status: 'PASS', message: 'Trade records preserve sender and receiver write boundaries.' }
  ])
  expect(mechanicalOutcomes(session, RELEASE)).toEqual([
    {
      status: 'PASS',
      message: 'receiver has not created an inbound copy; sender retains the outbound record',
      subject: `-/_TRADES/peer/repo/${id}.md`
    }
  ])
})

test('a committed preparation is valid on a sender-declared export and is not receivable', () => {
  const { home, local, peer } = fixture('peer/repo', false)
  const id = 'TRD-000000ab'
  writeRecord(
    local,
    '-',
    'peer/repo',
    id,
    record(id, 'local/repo', 'peer/repo', [], undefined, 'work', 'receipt', true)
  )
  writeFileSync(
    join(peer, '.ki-config.toml'),
    ['[skills.ki-repo]', 'repository = "https://github.com/peer/repo"', ''].join('\n')
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD)).toEqual([
    { status: 'PASS', message: 'Trade record identity and payload shape are valid.' }
  ])
  expect(mechanicalOutcomes(session, AUTH)).toEqual([
    { status: 'PASS', message: 'Trade records preserve sender and receiver write boundaries.' }
  ])
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toEqual([
    { status: 'PASS', message: 'Every trade record declares the phase its copy holds.' }
  ])
})

test('a preparation and its submitted successor share one peer path and differ only by phase', () => {
  const { home, local } = fixture()
  const preparingId = 'TRD-000000ac'
  const submittedId = 'TRD-000000ad'
  writeRecord(
    local,
    '-',
    'peer/repo',
    preparingId,
    record(preparingId, 'local/repo', 'peer/repo', [], undefined, 'work', 'decision', true)
  )
  writeRecord(local, '-', 'peer/repo', submittedId, record(submittedId, 'local/repo', 'peer/repo'))

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toEqual([
    { status: 'PASS', message: 'Every trade record declares the phase its copy holds.' }
  ])
  expect(mechanicalOutcomes(session, RECORD)).toEqual([
    { status: 'PASS', message: 'Trade record identity and payload shape are valid.' }
  ])
})

test('a missing, invalid, or misplaced phase is refused on every copy', () => {
  const { home, local, peer } = fixture()
  const absentId = 'TRD-000000b0'
  writeRecord(
    local,
    '-',
    'peer/repo',
    absentId,
    record(absentId, 'local/repo', 'peer/repo').replace('\n---\n', '\nphase: \n---\n')
  )
  const invalidId = 'TRD-000000b1'
  writeRecord(
    local,
    '-',
    'peer/repo',
    invalidId,
    record(invalidId, 'local/repo', 'peer/repo').replace('\n---\n', '\nphase: released\n---\n')
  )
  const misplacedId = 'TRD-000000b2'
  writeRecord(peer, '-', 'local/repo', misplacedId, record(misplacedId, 'peer/repo', 'local/repo'))
  writeRecord(
    local,
    '+',
    'peer/repo',
    misplacedId,
    record(misplacedId, 'peer/repo', 'local/repo', ['decision_status: unconsidered']).replace(
      '\n---\n',
      '\nphase: submitted\n---\n'
    )
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toContainEqual({
    status: 'VIOLATION',
    message: 'phase must be one of preparing, submitted, received',
    subject: `-/_TRADES/peer/repo/${absentId}.md`
  })
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toContainEqual({
    status: 'VIOLATION',
    message: 'phase must be one of preparing, submitted, received',
    subject: `-/_TRADES/peer/repo/${invalidId}.md`
  })
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toContainEqual({
    status: 'VIOLATION',
    message: 'an inbound record must declare phase: received',
    subject: `+/_TRADES/peer/repo/${misplacedId}.md`
  })
})

test('the retired _PREPARATIONS directory is refused', () => {
  const { home, local } = fixture()
  mkdirSync(join(local, '-', '_TRADES', '_PREPARATIONS'), { recursive: true })

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD, 'RECORD-2')).toContainEqual({
    status: 'VIOLATION',
    message:
      'the reserved -/_TRADES/_PREPARATIONS/ directory is retired; a preparation shares the submitted record peer path and declares phase: preparing',
    subject: '-/_TRADES/_PREPARATIONS/'
  })
})

test('phase carries the copy state without disturbing the immutable sender projection', () => {
  const { home, local, peer } = fixture()
  const id = 'TRD-000000b3'
  writeRecord(peer, '-', 'local/repo', id, record(id, 'peer/repo', 'local/repo'))
  writeRecord(local, '+', 'peer/repo', id, record(id, 'peer/repo', 'local/repo', ['decision_status: unconsidered']))

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, AUTH)).toEqual([
    { status: 'PASS', message: 'Trade records preserve sender and receiver write boundaries.' }
  ])
})

test('a blank line after frontmatter does not weaken exact H1 identity validation', () => {
  const { home, local } = fixture()
  const validId = 'TRD-00000003'
  writeRecord(local, '-', 'peer/repo', validId, record(validId, 'local/repo', 'peer/repo'))

  const valid = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(valid, RECORD)).toEqual([
    { status: 'PASS', message: 'Trade record identity and payload shape are valid.' }
  ])

  const invalidId = 'TRD-00000004'
  writeRecord(
    local,
    '-',
    'peer/repo',
    invalidId,
    record(invalidId, 'local/repo', 'peer/repo').replace(
      `# ${invalidId}: Submission title`,
      `# ${invalidId}: Altered title`
    )
  )

  const invalid = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(invalid, RECORD)).toContainEqual({
    status: 'VIOLATION',
    message: 'H1 must exactly repeat the trade id and title',
    subject: `-/_TRADES/peer/repo/${invalidId}.md`
  })
})

test('legacy or extended record identities are rejected', () => {
  const { home, local } = fixture()
  const id = 'HND-00000005'
  writeRecord(local, '-', 'peer/repo', id, record(id, 'local/repo', 'peer/repo'))

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD)).toContainEqual({
    status: 'VIOLATION',
    message: 'id must use canonical TRD plus eight lower-case hexadecimal characters',
    subject: `-/_TRADES/peer/repo/${id}.md`
  })

  const uuidId = 'TRD-00000000-0000-4000-8000-000000000005'
  writeRecord(local, '-', 'peer/repo', uuidId, record(uuidId, 'local/repo', 'peer/repo'))
  const uuidSession = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(uuidSession, RECORD)).toContainEqual({
    status: 'VIOLATION',
    message: 'id must use canonical TRD plus eight lower-case hexadecimal characters',
    subject: `-/_TRADES/peer/repo/${uuidId}.md`
  })
})

test('every submitted trade declares an observation policy', () => {
  const { home, local } = fixture()
  const id = 'TRD-00000006'
  writeRecord(local, '-', 'peer/repo', id, record(id, 'local/repo', 'peer/repo').replace('observation: decision\n', ''))

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(session, RECORD)).toContainEqual({
    status: 'VIOLATION',
    message: 'observation must be a non-empty sender field',
    subject: `-/_TRADES/peer/repo/${id}.md`
  })
})

test('sender and receiver write boundaries reject receiver fields outbound and changed inbound payload', () => {
  const { home, local, peer } = fixture()
  const outboundId = 'TRD-00000001'
  writeRecord(
    local,
    '-',
    'peer/repo',
    outboundId,
    record(outboundId, 'local/repo', 'peer/repo', ['decision_status: unconsidered'])
  )

  const inboundId = 'TRD-00000002'
  writeRecord(peer, '-', 'local/repo', inboundId, record(inboundId, 'peer/repo', 'local/repo'))
  writeRecord(
    local,
    '+',
    'peer/repo',
    inboundId,
    record(
      inboundId,
      'peer/repo',
      'local/repo',
      ['decision_status: unconsidered'],
      'The receiver changed the sender payload.'
    )
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  const messages = mechanicalOutcomes(session, AUTH).map((outcome) => outcome.message)
  expect(messages).toContain('sender-owned outbound record must not set receiver-local field decision_status')
  expect(messages).toContain('sender projection differs in meaning between outbound and inbound copies')
})

test('sender projection comparison accepts formatting drift with the same parsed values', () => {
  const { home, local, peer } = fixture()
  const id = 'TRD-00000006'
  const outbound = record(id, 'peer/repo', 'local/repo')
  writeRecord(peer, '-', 'local/repo', id, outbound)
  writeRecord(
    local,
    '+',
    'peer/repo',
    id,
    outbound
      .replace("title: 'Submission title'", 'title: "Submission title"')
      .replace('observation: decision', 'observation: decision\ndecision_status: unconsidered')
  )

  // A formatter may requote a scalar without changing what the record says, so this must
  // not read as tampering; only a change to the words may.
  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  const messages = mechanicalOutcomes(session, AUTH).map((outcome) => outcome.message)
  expect(messages).not.toContain('sender projection differs in meaning between outbound and inbound copies')
})

test('all receiver decision statuses are accepted with their required rationale and linkage', () => {
  const { home, local, peer } = fixture()
  const statuses = [
    ['unconsidered', []],
    ['in_progress', []],
    ['applied', [`applied_commit: ${'a'.repeat(40)}`]],
    ['adopted', ['adopted_as: KI-LOCAL-FND-001']],
    ['retained', ['retained_as: Knowledge/Local/Note']],
    ['parked', ["rationale: 'Wait for dependency.'"]],
    ['clarify', ["rationale: 'Confirm the expected boundary.'"]],
    ['declined', ["rationale: 'The proposal does not fit local scope.'"]],
    ['superseded', ["rationale: 'A newer submission replaces this one.'", 'superseded_by: TRD-00000099']]
  ] as const
  for (const [index, [status, fields]] of statuses.entries()) {
    const id = `TRD-${String(index + 10).padStart(8, '0')}`
    const kind = status === 'retained' ? 'knowledge' : 'work'
    writeRecord(peer, '-', 'local/repo', id, record(id, 'peer/repo', 'local/repo', [], undefined, kind))
    writeRecord(
      local,
      '+',
      'peer/repo',
      id,
      record(id, 'peer/repo', 'local/repo', [`decision_status: ${status}`, ...fields], undefined, kind)
    )
  }

  const valid = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(valid, STATUS)).toEqual([
    { status: 'PASS', message: 'Receiver decision statuses and local linkage are valid.' }
  ])

  const invalidId = 'TRD-00000090'
  writeRecord(peer, '-', 'local/repo', invalidId, record(invalidId, 'peer/repo', 'local/repo'))
  writeRecord(
    local,
    '+',
    'peer/repo',
    invalidId,
    record(invalidId, 'peer/repo', 'local/repo', ['decision_status: accepted'])
  )
  const invalid = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(invalid, STATUS).map((outcome) => outcome.message)).toContain(
    'decision_status must be one of unconsidered, in_progress, parked, clarify, applied, adopted, retained, declined, superseded'
  )

  const wrongKindId = 'TRD-00000091'
  writeRecord(peer, '-', 'local/repo', wrongKindId, record(wrongKindId, 'peer/repo', 'local/repo'))
  writeRecord(
    local,
    '+',
    'peer/repo',
    wrongKindId,
    record(wrongKindId, 'peer/repo', 'local/repo', ['decision_status: retained', 'retained_as: Knowledge/Local/Note'])
  )
  const wrongKind = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(wrongKind, STATUS).map((outcome) => outcome.message)).toContain(
    'retained is valid only for knowledge trades'
  )
})

test('only terminal receiver dispositions permit sender release and receiver pruning observation', () => {
  const { home, local } = fixture()
  const parkedId = 'TRD-00000020'
  writeRecord(
    local,
    '+',
    'peer/repo',
    parkedId,
    record(parkedId, 'peer/repo', 'local/repo', ['decision_status: parked', "rationale: 'Wait.'"])
  )
  const adoptedId = 'TRD-00000021'
  writeRecord(
    local,
    '+',
    'peer/repo',
    adoptedId,
    record(adoptedId, 'peer/repo', 'local/repo', ['decision_status: adopted', 'adopted_as: KI-LOCAL-FND-001'])
  )
  const retainedId = 'TRD-00000022'
  writeRecord(
    local,
    '+',
    'peer/repo',
    retainedId,
    record(
      retainedId,
      'peer/repo',
      'local/repo',
      ['decision_status: retained', 'retained_as: Knowledge/Local/Note'],
      undefined,
      'knowledge'
    )
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  const outcomes = mechanicalOutcomes(session, RELEASE)
  expect(outcomes).toContainEqual({
    status: 'VIOLATION',
    message: 'sender released its outbound copy before satisfying the decision observation policy',
    subject: `+/_TRADES/peer/repo/${parkedId}.md`
  })
  expect(outcomes).toContainEqual({
    status: 'INFO',
    message: 'eligible sender release is observable; receiver may prune this inbound copy',
    subject: `+/_TRADES/peer/repo/${adoptedId}.md`
  })
  expect(outcomes).toContainEqual({
    status: 'INFO',
    message: 'eligible sender release is observable; receiver may prune this inbound copy',
    subject: `+/_TRADES/peer/repo/${retainedId}.md`
  })
})

test('receipt and completion policies produce different release eligibility', () => {
  const { home, local, peer } = fixture()
  const receiptId = 'TRD-00000030'
  writeRecord(
    local,
    '-',
    'peer/repo',
    receiptId,
    record(receiptId, 'local/repo', 'peer/repo', [], undefined, 'work', 'receipt')
  )
  writeRecord(
    peer,
    '+',
    'local/repo',
    receiptId,
    record(receiptId, 'local/repo', 'peer/repo', ['decision_status: unconsidered'], undefined, 'work', 'receipt')
  )

  const completionId = 'TRD-00000031'
  writeRecord(
    local,
    '-',
    'peer/repo',
    completionId,
    record(completionId, 'local/repo', 'peer/repo', [], undefined, 'work', 'completion')
  )
  writeRecord(
    peer,
    '+',
    'local/repo',
    completionId,
    record(
      completionId,
      'local/repo',
      'peer/repo',
      ['decision_status: adopted', 'adopted_as: KI-PEER-FND-001'],
      undefined,
      'work',
      'completion'
    )
  )
  const roadmapDirectory = join(peer, 'docs', 'roadmap')
  mkdirSync(roadmapDirectory, { recursive: true })
  const roadmapPath = join(roadmapDirectory, 'KI-PEER-FND-001-linked-work.md')
  writeFileSync(
    roadmapPath,
    ['---', 'id: KI-PEER-FND-001', 'status: in-progress', '---', '', '# Linked work', ''].join('\n')
  )

  const waiting = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(waiting, RELEASE)).toContainEqual({
    status: 'INFO',
    message: 'receipt observation policy permits sender release',
    subject: `-/_TRADES/peer/repo/${receiptId}.md`
  })
  expect(mechanicalOutcomes(waiting, RELEASE)).toContainEqual({
    status: 'PASS',
    message: 'completion observation policy requires sender retention',
    subject: `-/_TRADES/peer/repo/${completionId}.md`
  })

  writeFileSync(roadmapPath, ['---', 'id: KI-PEER-FND-001', 'status: done', '---', '', '# Linked work', ''].join('\n'))
  const completed = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  expect(mechanicalOutcomes(completed, RELEASE)).toContainEqual({
    status: 'INFO',
    message: 'completion observation policy permits sender release',
    subject: `-/_TRADES/peer/repo/${completionId}.md`
  })
})

test('receipt and applied commit references require full lower-case commit ids', () => {
  const { home, local, peer } = fixture()
  const id = 'TRD-00000040'
  writeRecord(peer, '-', 'local/repo', id, record(id, 'peer/repo', 'local/repo'))
  writeRecord(
    local,
    '+',
    'peer/repo',
    id,
    record(id, 'peer/repo', 'local/repo', [
      'decision_status: applied',
      'received_from_ref: short',
      'applied_commit: abc'
    ])
  )

  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo'])))
  const messages = mechanicalOutcomes(session, STATUS).map((outcome) => outcome.message)
  expect(messages).toContain('received_from_ref must be a full 40-character lower-case hexadecimal commit')
  expect(messages).toContain('applied requires a full verified local applied_commit')
})

test('conform proposes only the local owned README scaffold and never writes a peer', () => {
  const { home, local, peer } = fixture()
  writeFileSync(join(local, '+', '_TRADES', 'README.md'), '# drift\n')
  const peerBefore = readFileSync(join(peer, '+', '_TRADES', 'README.md'), 'utf8')
  const session = createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo']), 'conform'))
  const scaffoldItem = SCAFFOLD.items[0]
  if (!scaffoldItem?.mechanical) throw new Error('SCAFFOLD-1 is missing')
  scaffoldItem.mechanical.conform?.run(SCAFFOLD.selectContext(session.subjects[0]?.context() as never))

  expect(session.proposal().writes.map((write) => write.path)).toEqual(['+/_TRADES/README.md'])
  expect(readFileSync(join(peer, '+', '_TRADES', 'README.md'), 'utf8')).toBe(peerBefore)
})

test('a preparation title is capped at six words, while submitted and received copies are exempt', () => {
  const { home, local, peer } = fixture()
  const seven = 'One two three four five six seven'
  const retitle = (contents: string, id: string, title: string): string =>
    contents
      .replace("title: 'Submission title'", `title: '${title}'`)
      .replace(`# ${id}: Submission title`, `# ${id}: ${title}`)
  const preparation = retitle(
    record('TRD-00000010', 'local/repo', 'peer/repo', [], undefined, 'work', 'decision', true),
    'TRD-00000010',
    seven
  )
  writeRecord(local, '-', 'peer/repo', 'TRD-00000010', preparation)

  const messages = () =>
    mechanicalOutcomes(
      createTradesSession(options(local, home, tradeConfiguration('local/repo', ['peer/repo']))),
      RECORD,
      'RECORD-3'
    ).map((outcome) => outcome.message)

  expect(messages()).toContain('title must be at most 6 words; this one has 7')

  // The same over-long title on a frozen copy must not be reported: retitling it would be
  // exactly the rewrite AUTH-1 exists to detect.
  writeRecord(local, '-', 'peer/repo', 'TRD-00000010', preparation.replace('phase: preparing', 'phase: submitted'))
  expect(messages()).not.toContain('title must be at most 6 words; this one has 7')

  const inbound = retitle(
    record('TRD-00000011', 'peer/repo', 'local/repo', ['decision_status: unconsidered']),
    'TRD-00000011',
    seven
  )
  writeRecord(
    peer,
    '-',
    'local/repo',
    'TRD-00000011',
    retitle(record('TRD-00000011', 'peer/repo', 'local/repo'), 'TRD-00000011', seven)
  )
  writeRecord(local, '+', 'peer/repo', 'TRD-00000011', inbound)
  expect(messages()).not.toContain('title must be at most 6 words; this one has 7')

  // Exactly six words is the boundary and passes.
  writeRecord(
    local,
    '-',
    'peer/repo',
    'TRD-00000010',
    retitle(preparation, 'TRD-00000010', 'One two three four five six').replace(
      `# TRD-00000010: ${seven}`,
      '# TRD-00000010: One two three four five six'
    )
  )
  expect(messages()).not.toContain('title must be at most 6 words; this one has 6')
})
