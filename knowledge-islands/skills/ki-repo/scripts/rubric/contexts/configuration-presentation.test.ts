import { describe, expect, test } from 'bun:test'
import { inspectConfigurationPresentation } from './configuration-presentation.ts'

const header = `# Knowledge Islands repository configuration.
# Its presence declares conformance with the Knowledge Islands repository standard.

`

const banner = (
  name: string
): string => `# -----------------------------------------------------------------------------
# ${name}
# -----------------------------------------------------------------------------
`

describe('configuration presentation', () => {
  test('permits a compact foundation without banners', () => {
    const result = inspectConfigurationPresentation(`${header}[repo]
harnesses = ["example/harness"]

[skills.ki-repo]

[skills.ki-authoring]

[skills.ki-engineering]
`)

    expect(result).toEqual({ substantial: false, issues: [] })
  })

  test('accepts canonical banners and contiguous owner blocks in a substantial file', () => {
    const result = inspectConfigurationPresentation(`${header}${banner('Foundation')}[repo]
harnesses = ["example/harness"]

[skills.ki-repo]

[skills.ki-repo.checks]
wiki = false

[skills.ki-authoring]

${banner('Governance runtime')}[skills.ki-engineering]

[skills.ki-binding]

[skills.ki-binding.clients.codex]
enabled = true

${banner('Change management')}[skills.ki-work]
adapter = "roadmap"
`)

    expect(result).toEqual({ substantial: true, issues: [] })
  })

  test('diagnoses missing and malformed substantial-file banners', () => {
    const missing = inspectConfigurationPresentation(`${header}[repo]

[skills.ki-repo]

[skills.ki-authoring]

[skills.ki-engineering]

[skills.ki-binding]

[skills.ki-work]
`)
    expect(missing.substantial).toBe(true)
    expect(missing.issues).toContain(
      'substantial .ki.toml must use Foundation and at least one additional neighbourhood banner'
    )

    const malformed = inspectConfigurationPresentation(`${header}# ---
# Foundation
# ---
[repo]

[skills.ki-repo]

[skills.ki-authoring]
`)
    expect(malformed.issues).toContain('line 5: Foundation banner must use the exact three-line comment form')
  })

  test('diagnoses foundation, owner, and banner-order drift', () => {
    const result = inspectConfigurationPresentation(`${header}${banner('Governance runtime')}[skills.ki-engineering]

[skills.ki-repo]

[skills.ki-authoring]

${banner('Foundation')}[repo]

[skills.ki-engineering.settings]
enabled = true

${banner('Relationships')}[skills.ki-trades.routes."example/receiver"]
export = ["work"]
`)

    expect(result.issues).toEqual(
      expect.arrayContaining([
        'line 7: [repo] must be the first table',
        'line 7: [skills.ki-repo] must be the first skill root',
        'line 11: [skills.ki-authoring] must follow [skills.ki-repo]',
        'line 13: Foundation banner is out of canonical order',
        '[skills.ki-engineering] is split across neighbourhood banners',
        'line 24: [skills.ki-trades] must be declared before its child tables'
      ])
    )
  })

  test('ignores banner-like text inside multiline strings', () => {
    const result = inspectConfigurationPresentation(`${header}[repo]

[skills.ki-repo]
description = """
# -----------------------------------------------------------------------------
# Foundation
# -----------------------------------------------------------------------------
"""

[skills.ki-authoring]
`)

    expect(result).toEqual({ substantial: false, issues: [] })
  })
})
