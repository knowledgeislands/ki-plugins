import { describe, expect, test } from 'bun:test'
import { createKiShapeContext } from '../contexts/contexts.ts'
import { KI_SHAPE } from './ki-shape.ts'

const referenceVocabulary = KI_SHAPE.items.find(({ code }) => code === 'KI-SHAPE-6')

if (!referenceVocabulary?.mechanical) throw new Error('KI-SHAPE-6 mechanical check missing')

describe('KI-SHAPE-6', () => {
  test('checks only top-level Markdown reference names', () => {
    const findings = referenceVocabulary.mechanical?.audit.run(
      createKiShapeContext({
        skill: {
          knowledgeIslandsSkill: true,
          referencePaths: ['radar.toml', 'standards-model-radar.md', 'notes.md']
        }
      })
    )

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      status: 'VIOLATION',
      subject: 'references/notes.md'
    })
  })

  test('allows non-Markdown reference artifacts', () => {
    const findings = referenceVocabulary.mechanical?.audit.run(
      createKiShapeContext({
        skill: {
          knowledgeIslandsSkill: true,
          referencePaths: ['radar.toml']
        }
      })
    )

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ status: 'PASS' })
  })
})
