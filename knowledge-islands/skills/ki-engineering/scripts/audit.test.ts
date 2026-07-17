#!/usr/bin/env bun
/** Run-based regression tests for ki-engineering's runner-neutral test policy. */
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CHECKER = join(dirname(fileURLToPath(import.meta.url)), 'audit.ts')

type Finding = { level: string; area: string; msg: string }

let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(scripts: Record<string, string>, vitest?: { file: string; content: string }, ci?: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ki-engineering-test-'))
  const fakeBin = join(dir, '.fake-bin')
  mkdirSync(fakeBin)
  for (const command of ['bun', 'bunx', 'tsc']) {
    const path = join(fakeBin, command)
    writeFileSync(path, '#!/bin/sh\nexit 0\n')
    chmodSync(path, 0o755)
  }
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'test-fixture',
        version: '0.0.0',
        description: 'fixture',
        author: 'Knowledge Islands',
        license: 'MIT',
        private: true,
        type: 'module',
        packageManager: 'bun@1.3.6',
        engines: { node: '>=22' },
        scripts: {
          'ki:audit': 'true',
          'ki:conform': 'true',
          clean: 'rm -rf node_modules',
          prepare: 'husky',
          ...scripts
        },
        devDependencies: {
          '@biomejs/biome': 'latest',
          knip: 'latest',
          prettier: 'latest',
          husky: 'latest',
          'lint-staged': 'latest',
          'markdownlint-cli2': 'latest',
          syncpack: 'latest',
          typescript: 'latest'
        },
        'lint-staged': { '*.ts': '@biomejs/biome check', '*.md': ['prettier --check', 'markdownlint-cli2'] }
      },
      null,
      2
    )}\n`
  )
  writeFileSync(join(dir, 'mise.toml'), '[tools]\nnode = "24"\nbun = "1.3.6"\n')
  writeFileSync(
    join(dir, 'tsconfig.json'),
    '{"compilerOptions":{"strict":true,"module":"nodenext","moduleResolution":"nodenext","noEmit":true,"isolatedModules":true,"esModuleInterop":true,"skipLibCheck":true}}\n'
  )
  writeFileSync(
    join(dir, 'biome.json'),
    '{"formatter":{"lineWidth":140,"indentWidth":2},"javascript":{"formatter":{"quoteStyle":"single","semicolons":"asNeeded","trailingCommas":"none"}},"linter":{"rules":{"recommended":true,"suspicious":{"noExplicitAny":"off"}}},"assist":{"actions":{"source":{"organizeImports":"on"}}}}\n'
  )
  writeFileSync(join(dir, 'knip.json'), '{}\n')
  writeFileSync(join(dir, '.ki-config.toml'), '[ki-engineering]\n')
  if (vitest) writeFileSync(join(dir, vitest.file), vitest.content)
  if (ci) {
    mkdirSync(join(dir, '.github', 'workflows'), { recursive: true })
    writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), ci)
  }
  return dir
}

function run(dir: string): Finding[] {
  const fakeBin = join(dir, '.fake-bin')
  const result = spawnSync(process.execPath, [CHECKER, dir, '--json'], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ''}` }
  })
  if (!result.stdout) throw new Error(`checker produced no JSON: ${result.stderr}`)
  return JSON.parse(result.stdout).findings as Finding[]
}

function hasFinding(findings: Finding[], area: string, level: string, message: string): boolean {
  return findings.some((finding) => finding.area === area && finding.level === level && finding.msg.includes(message))
}

function withFixture(
  scripts: Record<string, string>,
  assertion: (findings: Finding[]) => void,
  vitest?: { file: string; content: string },
  ci?: string
): void {
  const dir = fixture(scripts, vitest, ci)
  try {
    assertion(run(dir))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

withFixture({ test: 'bun scripts/checker.test.ts' }, (findings) => {
  check('runner-neutral bare test satisfies SCR-7', hasFinding(findings, 'SCR-7', 'PASS', 'bare "test" idiom present'))
  check('runner-neutral bare test selects the non-Vitest policy', hasFinding(findings, 'TEST-1', 'INFO', 'non-vitest test runner'))
})

withFixture({ test: 'bun test' }, (findings) => {
  check('literal bun test is rejected', hasFinding(findings, 'SCR-6', 'FAIL', 'uses "bun test"'))
})

withFixture({ test: 'bun scripts/checker.test.ts', 'ki:ci': 'bun run test' }, (findings) => {
  check('bun run test is not mistaken for literal bun test', hasFinding(findings, 'SCR-6', 'PASS', 'no "bun test"'))
})

withFixture(
  { test: 'bun scripts/checker.test.ts' },
  (findings) => {
    check('CI without the self-test command fails CI-2', hasFinding(findings, 'CI-2', 'FAIL', 'exact command'))
  },
  undefined,
  'steps:\n  - uses: jdx/mise-action@v3\n  - run: bun run ki:audit\n'
)

withFixture(
  { test: 'bun scripts/checker.test.ts' },
  (findings) => {
    check('CI with aggregate audit and self-tests passes CI-2', hasFinding(findings, 'CI-2', 'PASS', 'self-test suite'))
  },
  undefined,
  'steps:\n  - uses: jdx/mise-action@v3\n  - run: bun run ki:audit\n  - run: bun run test\n'
)

withFixture(
  { test: 'bun scripts/checker.test.ts' },
  (findings) => {
    check('CI rejects test:coverage as the bare self-test command', hasFinding(findings, 'CI-2', 'FAIL', 'exact command'))
  },
  undefined,
  'steps:\n  - uses: jdx/mise-action@v3\n  - run: bun run ki:audit\n  - run: bun run test:coverage\n'
)

withFixture(
  { test: 'bun scripts/checker.test.ts' },
  (findings) => {
    check('CI rejects self-tests before the aggregate audit', hasFinding(findings, 'CI-2', 'FAIL', 'before "bun run test"'))
  },
  undefined,
  'steps:\n  - uses: jdx/mise-action@v3\n  - run: bun run test\n  - run: bun run ki:audit\n'
)

const exactThresholds = `
export default {
  test: {
    coverage: {
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        "lines": 100,
        'branches': 100,
        functions: 100,
        statements: 100,
      },
    },
  },
}
`

withFixture(
  { test: 'vitest run', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('vitest.config.cts activates the Vitest profile', hasFinding(findings, 'TEST-1', 'PASS', 'test = "vitest run"'))
    check(
      'exact Vitest script profile passes',
      findings.filter((finding) => finding.area === 'TEST-1' && finding.level === 'PASS').length === 3
    )
    check('quoted exact 100 thresholds pass', hasFinding(findings, 'TEST-2', 'PASS', 'coverage thresholds 100%'))
  },
  { file: 'vitest.config.cts', content: exactThresholds }
)

withFixture(
  { test: 'vitest', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('non-canonical Vitest test script fails exact match', hasFinding(findings, 'TEST-1', 'FAIL', 'test should be "vitest run"'))
  },
  { file: 'vitest.config.ts', content: exactThresholds }
)

withFixture(
  { 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('Vitest config without bare test fails SCR-7', hasFinding(findings, 'SCR-7', 'FAIL', 'no bare "test" script'))
    check('Vitest profile reports the missing exact test script', hasFinding(findings, 'TEST-1', 'WARN', 'script "test" missing'))
  },
  { file: 'vitest.config.ts', content: exactThresholds }
)

withFixture(
  { test: 'vitest run', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('1000 does not satisfy an exact 100 threshold', hasFinding(findings, 'TEST-2', 'FAIL', 'must be 100/100/100/100'))
  },
  { file: 'vitest.config.ts', content: exactThresholds.replace('"lines": 100', '"lines": 1000') }
)

withFixture(
  { test: 'vitest run', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check(
      'threshold-looking keys outside coverage do not satisfy TEST-2',
      hasFinding(findings, 'TEST-2', 'FAIL', 'must be 100/100/100/100')
    )
  },
  {
    file: 'vitest.config.ts',
    content: `
const decoy = { test: { coverage: { thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 } } } }
export default { test: { coverage: { thresholds: { lines: 99, branches: 99, functions: 99, statements: 99 } } } }
void decoy
`
  }
)

withFixture(
  { test: 'vitest run', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('nested config-shaped decoy does not satisfy TEST-2', hasFinding(findings, 'TEST-2', 'FAIL', 'must be 100/100/100/100'))
  },
  {
    file: 'vitest.config.ts',
    content: `
export default {
  metadata: { test: { coverage: { thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 } } } },
  test: { coverage: { thresholds: { lines: 99, branches: 99, functions: 99, statements: 99 } } },
}
`
  }
)

withFixture(
  { test: 'vitest run', 'test:coverage': 'vitest run --coverage', 'test:watch': 'vitest' },
  (findings) => {
    check('nested metric decoys do not satisfy direct threshold metrics', hasFinding(findings, 'TEST-2', 'FAIL', 'must be 100/100/100/100'))
  },
  {
    file: 'vitest.config.ts',
    content: `
export default {
  test: {
    coverage: {
      thresholds: {
        nested: { lines: 100, branches: 100, functions: 100, statements: 100 },
        lines: 99,
        branches: 99,
        functions: 99,
        statements: 99,
      },
    },
  },
}
`
  }
)

if (failed) {
  console.log('\n\x1b[31maudit.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32maudit.test.ts: all checks passed\x1b[0m')
