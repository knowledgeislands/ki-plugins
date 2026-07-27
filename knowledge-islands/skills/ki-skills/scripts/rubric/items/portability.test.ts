import { describe, expect, test } from 'bun:test'
import { PORTABILITY } from './portability.ts'

const [portableContracts] = PORTABILITY.items

describe('portable contract rubric', () => {
  test('emits a stable actionable diagnostic', () => {
    const result = portableContracts?.mechanical?.audit.run({
      markdown: 'Use Codex.',
      subject: 'fixture.md',
      runtimeBinding: false,
      attributedSourceMaterial: false
    })

    expect(result).toEqual([
      {
        status: 'VIOLATION',
        message:
          'line 1: unqualified runtime reference to Codex — move it to a Runtime binding section, attribute it as source material, or compare runtimes explicitly'
      }
    ])
  })
})
