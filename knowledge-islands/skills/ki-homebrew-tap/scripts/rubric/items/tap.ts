import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { HomebrewTapRubricContext, TapContext } from '../contexts/homebrew-tap.ts'

const STANDARD = 'standards-homebrew-tap.md'
const SOURCE = [STANDARD] as const
const many = (outcomes: AuditOutcome[]): RubricOutcomes<AuditOutcome> => outcomes as RubricOutcomes<AuditOutcome>

const TAP_1: RubricItem<TapContext> = {
  code: 'TAP-1',
  title: 'formula directory',
  description: '`Formula/` exists and contains at least one Ruby formula.',
  sources: SOURCE,
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.targetExists) return [{ status: 'VIOLATION', message: 'Audit target must be an existing directory.' }]
        if (!context.applicable)
          return [{ status: 'NOT_APPLICABLE', message: 'No tap declaration or Formula/ structural marker is present.' }]
        if (context.formulaDirectory === 'unsafe')
          return [{ status: 'VIOLATION', message: 'Formula/ is not a regular directory.', subject: 'Formula/' }]
        if (context.formulaDirectory !== 'present')
          return [{ status: 'VIOLATION', message: 'Formula/ is absent; this is not a Homebrew tap.', subject: 'Formula/' }]
        if (context.formulae.length === 0)
          return [{ status: 'VIOLATION', message: 'Formula/ contains no Ruby formulae.', subject: 'Formula/' }]
        return [{ status: 'PASS', message: `${context.formulae.length} formulae found.`, subject: 'Formula/' }]
      }
    }
  }
}

const TAP_2: RubricItem<TapContext> = {
  code: 'TAP-2',
  title: 'formula class',
  description: 'Each formula has a `class <Camel> < Formula` declaration.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for class checks.' }]
        return many(
          context.formulae.map((formula) =>
            /^\s*class\s+[A-Z][A-Za-z0-9]*\s+<\s+Formula\b/m.test(formula.text)
              ? { status: 'PASS', message: 'Formula class declaration is present.', subject: `Formula/${formula.file}` }
              : {
                  status: 'VIOLATION',
                  message: 'The formula has no `class <Camel> < Formula` declaration.',
                  subject: `Formula/${formula.file}`
                }
          )
        )
      }
    }
  }
}

const TAP_3: RubricItem<TapContext> = {
  code: 'TAP-3',
  title: 'formula fields',
  description: 'Each formula has the required metadata, install method, and test block.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for field checks.' }]
        const required = [
          ['desc', /^\s*desc\s+"/m],
          ['homepage', /^\s*homepage\s+"/m],
          ['url', /^\s*url\s+"/m],
          ['sha256', /^\s*sha256\s+"/m],
          ['license', /^\s*license\s+/m],
          ['install method', /^\s*def\s+install\b/m],
          ['test do', /^\s*test\s+do\b/m]
        ] as const
        const outcomes = context.formulae.flatMap((formula) =>
          required
            .filter(([, pattern]) => !pattern.test(formula.text))
            .map(([field]) => ({
              status: 'VIOLATION' as const,
              message: `Required field is absent: ${field}.`,
              subject: `Formula/${formula.file}`
            }))
        )
        return outcomes.length > 0 ? many(outcomes) : [{ status: 'PASS', message: 'Every formula has the required fields.' }]
      }
    }
  }
}

const TAP_4: RubricItem<TapContext> = {
  code: 'TAP-4',
  title: 'formula description style',
  description: 'Formula descriptions are no more than 80 characters and do not start with an article.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0)
          return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for description checks.' }]
        const outcomes = context.formulae.flatMap((formula) => {
          const description = formula.text.match(/^\s*desc\s+"([^"]*)"/m)?.[1]
          if (!description) return []
          const subject = `Formula/${formula.file}`
          return [
            ...(description.length > 80
              ? [
                  {
                    status: 'VIOLATION' as const,
                    message: `Description is ${description.length} characters; Homebrew permits at most 80.`,
                    subject
                  }
                ]
              : []),
            ...(/^(A|An|The)\s/.test(description)
              ? [{ status: 'VIOLATION' as const, message: 'Description begins with an article.', subject }]
              : [])
          ]
        })
        return outcomes.length > 0 ? many(outcomes) : [{ status: 'PASS', message: 'Formula descriptions follow Homebrew style.' }]
      }
    }
  }
}

const TAP_5: RubricItem<TapContext> = {
  code: 'TAP-5',
  title: 'versioned source URLs',
  description: 'Formula URLs use a tagged-release tarball rather than a branch or HEAD.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for URL checks.' }]
        const outcomes = context.formulae.flatMap((formula) => {
          const url = formula.text.match(/^\s*url\s+"([^"]*)"/m)?.[1]
          return url && !/\/archive\/refs\/tags\/|\/releases\/download\//.test(url)
            ? [{ status: 'VIOLATION' as const, message: 'Source URL is not a tagged-release tarball.', subject: `Formula/${formula.file}` }]
            : []
        })
        return outcomes.length > 0 ? many(outcomes) : [{ status: 'PASS', message: 'Formula source URLs are versioned.' }]
      }
    }
  }
}

const TAP_6: RubricItem<TapContext> = {
  code: 'TAP-6',
  title: 'formula discoverability',
  description: 'README.md lists every formula by name.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for README checks.' }]
        if (context.readme === null)
          return [
            { status: 'VIOLATION', message: 'README.md is absent; formula discoverability cannot be verified.', subject: 'README.md' }
          ]
        const outcomes = context.formulae
          .filter((formula) => !context.readme?.includes(formula.name))
          .map((formula) => ({
            status: 'VIOLATION' as const,
            message: 'Formula name is absent from README.md.',
            subject: `Formula/${formula.file}`
          }))
        return outcomes.length > 0 ? many(outcomes) : [{ status: 'PASS', message: 'README.md lists every formula.' }]
      }
    }
  }
}

const TAP_7: RubricItem<TapContext> = {
  code: 'TAP-7',
  title: 'Homebrew audit',
  description: 'Homebrew style and strict audit are run explicitly for every formula.',
  sources: SOURCE,
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'DERIVED',
      run: (context) => {
        if (!context.applicable) return [{ status: 'NOT_APPLICABLE', message: 'ki-homebrew-tap is not applicable.' }]
        if (context.formulae.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'No formulae are available for Homebrew checks.' }]
        return context.formulae.map((formula) => ({
          status: 'VIOLATION',
          message: `Run Homebrew validation explicitly: brew style Formula/${formula.file} and brew audit --strict ${formula.name}.`,
          subject: `Formula/${formula.file}`
        }))
      }
    }
  }
}

const TAP_J1: RubricItem<TapContext> = {
  code: 'TAP-J1',
  title: 'tap naming',
  description: 'The repository name follows Homebrew tap naming conventions.',
  sources: SOURCE,
  judgment: { prompt: 'Does the repository name follow the `homebrew-<name>` convention without an unsafe rename?' }
}
const TAP_J2: RubricItem<TapContext> = {
  code: 'TAP-J2',
  title: 'meaningful formula test',
  description: 'Each `test do` block exercises an installed binary rather than a placeholder.',
  sources: SOURCE,
  judgment: { prompt: 'Does each formula test exercise its installed binary with a meaningful assertion?' }
}
const TAP_J3: RubricItem<TapContext> = {
  code: 'TAP-J3',
  title: 'install correctness',
  description: 'Each install block installs the artefact the tool actually ships.',
  sources: SOURCE,
  judgment: { prompt: 'Does each `def install` block install the artefact the tool actually ships?' }
}
const TAP_J4: RubricItem<TapContext> = {
  code: 'TAP-J4',
  title: 'source integrity',
  description: 'Checksums and release tags correspond to the declared source archive.',
  sources: SOURCE,
  judgment: { prompt: 'Do each source URL, version, and checksum correspond to the intended release archive?' }
}
const TAP_J5: RubricItem<TapContext> = {
  code: 'TAP-J5',
  title: 'fresh README entries',
  description: 'README formula rows have accurate descriptions and source links.',
  sources: SOURCE,
  judgment: { prompt: 'Are README formula rows complete, current, and accurate?' }
}
const TAP_J6: RubricItem<TapContext> = {
  code: 'TAP-J6',
  title: 'CI Homebrew coverage',
  description: 'Tap CI runs `brew test-bot` when local Homebrew is unavailable.',
  sources: SOURCE,
  judgment: { prompt: 'When local Homebrew is unavailable, does CI run the appropriate Homebrew test-bot checks?' }
}
export const TAP: RubricFamily<HomebrewTapRubricContext, TapContext> = {
  code: 'TAP',
  title: 'tap structure',
  description: 'Formula layout, explicit Homebrew validation, and judgment review of tap correctness.',
  standard: STANDARD,
  selectContext: (context) => context.tap,
  items: [TAP_1, TAP_2, TAP_3, TAP_4, TAP_5, TAP_6, TAP_7, TAP_J1, TAP_J2, TAP_J3, TAP_J4, TAP_J5, TAP_J6]
}
