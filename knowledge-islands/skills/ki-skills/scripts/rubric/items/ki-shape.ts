import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import { type KiShapeRubricContext, type KiSkillsRubricContext, selectKiSkillsContext } from '../contexts/contexts.ts'

const UNIVERSAL_VERBS = ['AUDIT', 'CONFORM', 'EDUCATE', 'REFRESH', 'HELP'] as const

const KI_SHAPE_1: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-1',
  title: 'standard skills resolve base bindings at runtime',
  description: 'A **standard** KI skill resolves base bindings at runtime and hard-codes **no single base**.',
  sources: ['ki-agentic-harness README', '`ki-kb`'],
  judgment: { prompt: 'Does this standard skill resolve base bindings at runtime without hard-coding one base?' }
}

const KI_SHAPE_2: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-2',
  title: 'skills compose rather than extend',
  description:
    '**Composition is the only inter-skill relationship — the base-coupled extension pattern is retired.** A skill builds on another by running the sibling\'s checker/mode **in sequence** and adding its delta (never importing it), and **declares the edge** — naming the sibling and the run order in its AUDIT mode. What a base needs differently is **declared, not forked**: data in the repo\'s own `.ki-config` table (read validate-down), prose in its `CLAUDE.md` — never a `<base>-kb`-style skill that takes the shared modes by name. _Delegation between two standards (kb → streams) is composition at sub-scope._ The linter flags **endorsement of the retired pattern** (telling a base to ship/"prefer" an extension skill, or that a skill "delegates the modes back" / "extends this one") as a mechanical heuristic; the **[J]** gate is that no skill in the set models a relationship as a base-coupled extension.',
  sources: ['ki-agentic-harness README', '`ki-engineering`'],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill) return [{ status: 'NOT_APPLICABLE', message: 'skill evidence is unavailable for composition inspection' }]
        const violations = skill.retiredExtensionFiles.map((file) => ({
          status: 'VIOLATION' as const,
          message:
            'endorses the retired base-coupled extension pattern (ship/"prefer" an extension skill, "delegates the modes back", "extends this one") — relationships are composition only; declare base differences in .ki-config / CLAUDE.md, per KI-SHAPE-2',
          subject: file
        }))
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'skills compose rather than extend' }]
      }
    }
  },
  judgment: { prompt: 'Does every inter-skill relationship use declared composition rather than base-coupled extension?' }
}

const KI_SHAPE_3: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-3',
  title: 'the skill declares its kind',
  description:
    'The skill declares its **kind** — **governance** or **process** — clearly (ADR-KI-HARNESS-SKILLS-006). A **governance skill** holds a house standard and exposes the universal modes (KI-SHAPE-5). A **process skill** drives an action or lifecycle rather than holding a standard: it is lightweight, may bundle a helper `scripts/` and a `references/` procedure, and is exempt from universal governance modes — its mode count follows its own lifecycle and it exposes HELP only optionally. Both kinds use the closed Knowledge Islands reference vocabulary (KI-SHAPE-6) and are dual-invocable (`/<name>` and model-triggered).',
  sources: ['ki-agentic-harness README', 'ADR-KI-HARNESS-SKILLS-006'],
  judgment: { prompt: 'Does the skill correctly and clearly declare its governance or process kind?' }
}

const KI_SHAPE_4: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-4',
  title: 'a skill validates only its own configuration table',
  description:
    "A skill that reads the shared `.ki-config.toml` consumes and **validates only its own `[<skill>]` table** — warns on a key it doesn't recognise, advises dropping one that merely restates a default — and never inspects another skill's table. Validate down, ignore across.",
  sources: ['contract defined by `ki-repo`'],
  judgment: { prompt: 'Does this skill validate only its own configuration table and ignore unrelated tables?' }
}

const KI_SHAPE_5: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-5',
  title: 'governance skills expose universal modes',
  description:
    "A **governance skill** (one that holds a standard) exposes the universal modes **AUDIT** + **CONFORM** + **EDUCATE** + **REFRESH**. AUDIT and CONFORM run through the skill's hosted rubric; EDUCATE teaches or creates the governed artifact from that standard; REFRESH re-anchors the standard to its sources. Further modes (`OPTIMISE` to push a compliant artifact from the floor toward excellent, and operational modes like kb's note-ops) are skill-specific. Modes are named, not lettered, and ordered alphabetically in the body and `argument-hint`.",
  sources: ['ki-agentic-harness README'],
  judgment: { prompt: 'Does this governance skill expose the universal modes with appropriate additional modes only?' }
}

const KI_SHAPE_6: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-6',
  title: 'Knowledge Islands skills use the closed reference vocabulary',
  description:
    '_Closed reference vocabulary — Knowledge Islands skills only._ Every top-level Markdown reference is `standards-<topic>.md`, generated `rubric.md`, `sources.md`, optional `exemplars.md`, or one-mode-only `mode-<verb>.md`; a skill includes only the classes it needs. Normative formats, process doctrine, and shared mode contracts are standards. Combined mode names, bare `standards.md`, `<topic>-standards.md`, nested references, and ad hoc guide, format, or contract filenames are retired. Templates and reusable output material live in `assets/`. A skill tracking a moving external spec keeps a current-state `## Last review` block in `sources.md`. Skills outside the Knowledge Islands set are exempt.',
  sources: ['ki-agentic-harness README'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill?.knowledgeIslandsSkill) return [{ status: 'NOT_APPLICABLE', message: 'the target is not a Knowledge Islands skill' }]
        const allowed = /^(?:exemplars|rubric|sources|standards-[a-z0-9]+(?:-[a-z0-9]+)*|mode-[a-z0-9]+)\.md$/
        const violations = skill.referencePaths
          .filter((path) => !allowed.test(path))
          .map((path) => ({
            status: 'VIOLATION' as const,
            message: 'reference is outside the closed Knowledge Islands filename vocabulary',
            subject: `references/${path}`
          }))
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'reference files use the closed Knowledge Islands vocabulary' }]
      }
    }
  },
  judgment: { prompt: 'Does each retained reference class serve a distinct reader need, with templates and executable helpers elsewhere?' }
}

const KI_SHAPE_7: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-7',
  title: 'behaviour-changing skills define and check their anchor',
  description:
    '_A behaviour-changing skill defines its gate — and checks the anchor._ A skill that changes a **default behaviour** — installs a gate, a standing "always do X before Y" rule, or a routing intercept — cannot rely on its own `description` to fire it, because skills load **on demand** and the triggering request often won\'t mention the skill (e.g. "edit this note" never says "proposal"). Such a skill must **anchor the behaviour in always-loaded context** (the base/repo `CLAUDE.md` / `AGENTS.md`, or a companion skill that _does_ reliably load handing off to it), **and its rubric must verify the anchor is present** so it can\'t be silently lost. The hosted audit surfaces candidates mechanically (strong gate phrasing in the body or a reference file — body + references scanned as one unit, since mode-routing lifts procedures out of the body — without an anchor its rubric reads); the **[J]** call is whether the skill genuinely changes a default and so _needs_ a gate. Realised as `ki-kb-streams`\' **GATE-1** (the Enactment gate) and `ki-kb`\'s **MEM-2** (the memory cascade); `ki-repo`\'s `.ki-config.toml` marker is the same pattern (anchor + checked).',
  sources: ['standards-knowledge-islands.md §2', 'standards-rubric-authoring.md#context-and-evidence'],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill) return [{ status: 'NOT_APPLICABLE', message: 'skill evidence is unavailable for anchor inspection' }]
        if (!skill.strongGate) return [{ status: 'NOT_APPLICABLE', message: 'the skill does not appear to change default behaviour' }]
        return skill.anchorMentioned && skill.rubricReadsAnchor
          ? [{ status: 'PASS', message: 'the behaviour-changing skill defines and checks its anchor' }]
          : [
              {
                status: 'VIOLATION',
                message:
                  'reads as behaviour-changing (a gate / standing rule) but does not evidence an always-on anchor verified by its rubric — anchor it in CLAUDE.md/AGENTS.md and check the anchor, per KI-SHAPE-7'
              }
            ]
      }
    }
  },
  judgment: { prompt: 'Does a behaviour-changing skill have an appropriate always-loaded anchor that its rubric verifies?' }
}

const KI_SHAPE_9: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-9',
  title: 'mechanical work belongs in the structured rubric',
  description:
    '_Mechanical work belongs in the structured rubric, not in tokens._ A criterion a script can decide deterministically — no judgment, no AI benefit — is tagged **[M]** and implemented in `scripts/rubric/items/`; a **[J]** tag is earned by the judgment a criterion genuinely needs, never by "no implementation written yet". The reader\'s context is spent only on the **[J]** items, so a mechanical criterion left to prose, or a **[J]** the rubric already decides, is drift — it **moves into the structured rubric and flips to [M]**. The linter surfaces the mechanical heuristic — a rubric carrying **[M]** criteria but shipping no structured rubric (nor a documented toolchain delegation to a skill-scoped audit) — as a WARN; the **[J]** gate is whether each remaining **[J]** genuinely needs a reader rather than a script.',
  sources: ['[Rubric authoring](standards-rubric-authoring.md)'],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill || skill.mechanicalRubricCount === 0)
          return [{ status: 'NOT_APPLICABLE', message: 'the skill declares no mechanical rubric criteria' }]
        return skill.hasMechanicalImplementation || skill.documentsMechanicalDelegation
          ? [{ status: 'PASS', message: 'mechanical work belongs in the structured rubric' }]
          : [
              {
                status: 'VIOLATION',
                message: `rubric tags ${skill.mechanicalRubricCount} criteria [M] but the skill ships no structured rubric (nor a documented toolchain delegation) — mechanical work belongs in the structured rubric, not in tokens, per KI-SHAPE-9`
              }
            ]
      }
    }
  },
  judgment: { prompt: 'Do remaining judgment criteria genuinely require review rather than deterministic checking?' }
}

const KI_SHAPE_10: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-10',
  title: 'skills do not assume private user configuration',
  description:
    "_A skill must not assume personal runtime configuration._ A Knowledge Islands skill is installed by any contributor, not only its author. It must not assume the user has any particular private configuration or imported topic files — plan-mode gates, house style rules, footnote conventions, workflow preferences. Any behaviour a skill requires beyond what the open spec guarantees must be **anchored in always-loaded repo context** (`CLAUDE.md`, `AGENTS.md`, or a KI-SHAPE-7-style companion hook) — not in the author's private config. Where a skill cross-checks a convention that _might_ live in personal config, it must degrade gracefully rather than silently rely on that content being present.",
  sources: ['standards-knowledge-islands.md §2'],
  judgment: { prompt: 'Does the skill avoid assuming private personal configuration?' }
}

const KI_SHAPE_11: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-11',
  title: 'governance skills expose HELP',
  description:
    "_Exposes the universal HELP mode._ Every governance skill's `argument-hint` lists a `help` verb, so the no-mode default and the `help` / `-h` / `?` pure-explain form are discoverable (ADR-KI-HARNESS-SKILLS-001). A skill derives its help from its own frontmatter and operating-mode prose; it carries no generated wrapper or separate HELP payload. The linter verifies the `help` token; the prose HELP semantics are KI-INVOKE-1 **[J]**.",
  sources: ['ADR-KI-HARNESS-SKILLS-001'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill || skill.argumentHint === undefined)
          return [{ status: 'NOT_APPLICABLE', message: '`argument-hint` is unavailable for HELP-mode inspection' }]
        return skill.hintVerbs.includes('HELP')
          ? [{ status: 'PASS', message: 'governance skills expose HELP' }]
          : [{ status: 'VIOLATION', message: '`argument-hint` does not expose the universal `help` mode (ADR-KI-HARNESS-SKILLS-001)' }]
      }
    },
    conform: {
      phase: 'NORMALISE',
      run: ({ skill, addArgumentHintVerbs }) => {
        if (skill?.governanceSkill && skill.argumentHint && !skill.hintVerbs.includes('HELP')) addArgumentHintVerbs?.(['help'])
      }
    }
  }
}

const auditKiShape12 = ({ skill }: KiShapeRubricContext): RubricOutcomes<AuditOutcome> => {
  if (!skill?.governanceSkill) return [{ status: 'NOT_APPLICABLE', message: 'the target is not a governance skill' }]
  const violations: AuditOutcome[] = []
  const missing = UNIVERSAL_VERBS.filter((verb) => !skill.hintVerbs.includes(verb))
  if (missing.length > 0)
    violations.push({
      status: 'VIOLATION',
      message: `\`argument-hint\` is missing the universal verb(s) ${missing.map((verb) => verb.toLowerCase()).join(', ')} — a governance skill exposes AUDIT, CONFORM, EDUCATE, REFRESH and HELP (ADR-KI-HARNESS-SKILLS-001)`
    })
  const [first, ...rest] = violations
  return first ? [first, ...rest] : [{ status: 'PASS', message: 'governance mode vocabulary is canonical and complete' }]
}

const KI_SHAPE_12: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-12',
  title: 'governance mode vocabulary is canonical and complete',
  description:
    '_Mode vocabulary is canonical and complete._ A governance skill exposes **AUDIT**, **CONFORM**, **EDUCATE**, **REFRESH** and **HELP** spelled exactly so — a governance skill missing any universal verb from its `argument-hint` (EDUCATE is the common gap) **WARNs**; `NEW`, `OPTIMISE`, and operational verbs are additive, never substitutes for a universal mode (a collection skill exposes both EDUCATE and NEW). The current source-entrypoint migration invariant is validated by KI-SHAPE-15; direct delivery resolves registered operations from the verified collection. Process skills are exempt throughout.',
  sources: ['ADR-KI-HARNESS-SKILLS-001', 'ADR-KI-HARNESS-SKILLS-006', 'ADR-KI-HARNESS-007'],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: auditKiShape12 },
    conform: {
      phase: 'PRIMARY',
      run: ({ skill, addArgumentHintVerbs }) => {
        if (!skill?.governanceSkill || !skill.argumentHint || !addArgumentHintVerbs) return
        const missing = UNIVERSAL_VERBS.filter((verb) => !skill.hintVerbs.includes(verb))
        if (missing.length > 0) addArgumentHintVerbs(missing.map((verb) => verb.toLowerCase()))
      }
    }
  }
}

const KI_SHAPE_13: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-13',
  title: 'mode headings have a canonical structure',
  description:
    '_Mode-heading structure._ A governance skill presents its modes under a **single `## Operating modes` H2** (the home for the shared no-mode/HELP intro), with each mode as a **`### Mode <NAME>` H3** or — for router skills with many operational verbs — a **`| Mode | … |` dispatch table** inside that section. The linter WARNs on a flat `## Mode X` H2, a bare `### X` heading missing the `Mode` prefix, and any `argument-hint` verb absent from the Operating-modes body (hint ⊆ body). Process skills are exempt.',
  sources: ['ADR-KI-HARNESS-SKILLS-001'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill?.governanceSkill) return [{ status: 'NOT_APPLICABLE', message: 'the target is not a governance skill' }]
        const violations: AuditOutcome[] = []
        if (skill.operatingModesSection === null)
          violations.push({
            status: 'VIOLATION',
            message: 'no `## Operating modes` H2 — modes live under a single wrapper H2 (ADR-KI-HARNESS-SKILLS-001)'
          })
        for (const heading of skill.flatModeHeadings)
          violations.push({
            status: 'VIOLATION',
            message: `flat \`## Mode ${heading}\` H2 — demote to \`### Mode ${heading}\` inside the \`## Operating modes\` wrapper`
          })
        for (const heading of skill.bareModeHeadings)
          violations.push({
            status: 'VIOLATION',
            message: `bare \`### ${heading}\` inside \`## Operating modes\` — mode headings carry the \`Mode \` prefix`
          })
        if (skill.operatingModesSection !== null)
          for (const verb of skill.hintVerbs) {
            if (skill.bodyModes.has(verb)) continue
            if (verb === 'HELP' && /\bhelp\b/i.test(skill.operatingModesIntro)) continue
            violations.push({
              status: 'VIOLATION',
              message: `\`argument-hint\` verb \`${verb.toLowerCase()}\` has no mode in the \`## Operating modes\` section (hint ⊆ body)`
            })
          }
        const [first, ...rest] = violations
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'mode headings have a canonical structure' }]
      }
    }
  }
}

const KI_SHAPE_14: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-14',
  title: 'REFRESH states its ownership precondition',
  description:
    "_REFRESH states its ownership precondition._ REFRESH's write target is normally the skill's own canonical files under `skills/<name>/` in `ki-agentic-harness` — a governance skill's `### Mode REFRESH` section (or, per REF-5, its `references/mode-refresh.md`) must name `ki-agentic-harness` as the only place it writes, and instruct the agent to stop and redirect when invoked from an installed copy (to the harness, or — for a pattern recurring across bases — to `ki-kb`'s IMPROVE mode). The one committed repository-local source at `.agents/skills/ki-self/` instead names that local source and stops to promote reusable rules to their shared owner. Missing either half **WARNs**. Process skills (KI-SHAPE-3) are exempt; a skill with no REFRESH section at all is already caught by KI-SHAPE-12.",
  sources: ['ADR-KI-HARNESS-SKILLS-001', 'ADR-KI-HARNESS-SKILLS-006'],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill?.governanceSkill || !skill.refreshText)
          return [{ status: 'NOT_APPLICABLE', message: 'the target has no governance REFRESH procedure to inspect' }]
        const namesOwner = skill.localGovernanceSource
          ? /\.agents\/skills\/ki-self/.test(skill.refreshText)
          : /ki-agentic-harness/.test(skill.refreshText)
        const stopsAndRedirects = skill.localGovernanceSource
          ? /\bstop(s)?\b[\s\S]{0,160}\bpromot\w*/i.test(skill.refreshText)
          : /\bstop(s)?\b[\s\S]{0,160}\b(redirect|names?|route)/i.test(skill.refreshText)
        return namesOwner && stopsAndRedirects
          ? [
              {
                status: 'PASS',
                message: skill.localGovernanceSource
                  ? 'REFRESH states the repository-local ownership precondition'
                  : 'REFRESH states its harness-only precondition'
              }
            ]
          : [
              {
                status: 'VIOLATION',
                message: skill.localGovernanceSource
                  ? 'REFRESH section does not state the repository-local ownership precondition — it should name `.agents/skills/ki-self/` and instruct stopping to promote reusable rules to their shared owner'
                  : 'REFRESH section does not state the harness-only precondition — it should name `ki-agentic-harness` as the only place it writes and instruct stopping/redirecting when invoked from an installed copy'
              }
            ]
      }
    }
  }
}

const auditKiShape15 = ({ skill }: KiShapeRubricContext): RubricOutcomes<AuditOutcome> => {
  if (!skill?.governanceSkill || skill.localGovernanceSource)
    return [{ status: 'NOT_APPLICABLE', message: 'the target is not a direct governance capability' }]
  const violations: AuditOutcome[] = []
  for (const script of ['govern.ts', 'educate.ts', 'audit.ts', 'conform.ts'])
    if (skill.scriptNames.includes(script))
      violations.push({
        status: 'VIOLATION',
        message: `\`scripts/${script}\` is retired — expose the catalogue only through \`scripts/rubric/items/index.ts\``
      })
  const [first, ...rest] = violations
  return first ? [first, ...rest] : [{ status: 'PASS', message: 'governance skills expose no legacy runner entrypoints' }]
}

const KI_SHAPE_15: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-15',
  title: 'governance skills expose no legacy runner entrypoints',
  description:
    '_Direct governance operation shape._ A governance skill exposes its rubric catalogue from `scripts/rubric/items/index.ts`; `ki` resolves and hosts that catalogue from the verified installed harness. `scripts/govern.ts`, `scripts/educate.ts`, `scripts/audit.ts`, and `scripts/conform.ts` are retired, with no compatibility runner or fallback. REFRESH is harness-only. Process skills and the committed repository-local `.agents/skills/ki-self/` source are exempt.',
  sources: ['standards-knowledge-islands.md §2', 'ADR-KI-HARNESS-007'],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: auditKiShape15 }
  }
}

const KI_SHAPE_16: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-16',
  title: 'target files have declared ownership',
  description:
    "_Declared file ownership, three tiers._ A skill whose rubric reads or changes a house-standard file in the **target repository's** working tree declares that relationship in frontmatter, alongside `ki-depends-on:`, under one of three keys: `requires:` (must exist, doesn't create/control it — any number of skills may share a `requires:` filename), `contributes:` (writes/expects only its own section of a shared file — any number of skills may share a `contributes:` filename, e.g. `.ki-config.toml`, `package.json`), or `owns:` (sole author of the whole file — **exclusive**, at most one skill per filename). The mechanical heuristic verifies that declared filenames occur in the skill's production implementation and that no filename is owned by more than one skill. Judgment confirms that every session proposal and governed read has the appropriate declaration.",
  sources: ['KI'],
  mechanical: {
    level: 'WARN',
    heuristic: true,
    audit: {
      phase: 'INSPECT',
      run: ({ skill, ownershipCollisions }) => {
        if (!skill && ownershipCollisions.length === 0)
          return [{ status: 'NOT_APPLICABLE', message: 'skill and ownership-collision evidence are unavailable' }]
        const violations: AuditOutcome[] = []
        if (skill) {
          if (skill.implementationSource !== null)
            for (const file of [...skill.owns, ...skill.contributes, ...skill.requires])
              if (!skill.implementationSource.includes(file))
                violations.push({
                  status: 'VIOLATION',
                  message: `declares \`${file}\` (owns/contributes/requires) but its production implementation does not reference it`
                })
        }
        for (const collision of ownershipCollisions)
          violations.push({
            status: 'VIOLATION',
            message: `\`owns: ${collision.file}\` is declared by ${[...collision.skills].sort().join(', ')} — owns: is exclusive; split into a single owner plus contributes:/requires: on the rest`
          })
        const sorted = violations.sort((left, right) => left.message.localeCompare(right.message))
        const [first, ...rest] = sorted
        return first ? [first, ...rest] : [{ status: 'PASS', message: 'target files have declared ownership' }]
      }
    }
  },
  judgment: { prompt: 'Do all governed target-file reads and session proposals carry the appropriate ownership declaration?' }
}

const KI_SHAPE_17: RubricItem<KiShapeRubricContext> = {
  code: 'KI-SHAPE-17',
  title: 'dependencies are declared explicitly',
  description:
    "_Explicit dependency declaration._ Every skill declares `ki-depends-on:` as a single-line flow list. `ki-depends-on: []` is the required explicit form when a skill has no governance dependencies. The listed capability names and a governed repository's matching `.ki-config.toml` tables are validated by the dependency graph and bootstrap; the skill checker enforces the local declaration shape.",
  sources: ['ADR-KI-HARNESS-SKILLS-006'],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: ({ skill }) => {
        if (!skill) return [{ status: 'NOT_APPLICABLE', message: 'skill evidence is unavailable for dependency inspection' }]
        if (!skill.dependsOnPresent)
          return [
            {
              status: 'VIOLATION',
              message:
                'frontmatter carries no `ki-depends-on:` declaration — declare `ki-depends-on: []` when the skill has no governance dependencies'
            }
          ]
        return /^\[[^\]]*\]$/.test(skill.dependsOn)
          ? [{ status: 'PASS', message: 'dependencies are declared explicitly' }]
          : [
              {
                status: 'VIOLATION',
                message: `\`ki-depends-on:\` must be a single-line flow list (got \`${skill.dependsOn}\`)`
              }
            ]
      }
    }
  }
}

export const KI_SHAPE: RubricFamily<KiSkillsRubricContext, KiShapeRubricContext> = {
  code: 'KI-SHAPE',
  title: 'Knowledge Islands skill shape',
  description: 'The common shape of a Knowledge Islands governance skill.',
  standard: 'standards-knowledge-islands.md#2-skill-shape',
  selectContext: (context: KiSkillsRubricContext) => selectKiSkillsContext(context, 'shape'),
  items: [
    KI_SHAPE_1,
    KI_SHAPE_2,
    KI_SHAPE_3,
    KI_SHAPE_4,
    KI_SHAPE_5,
    KI_SHAPE_6,
    KI_SHAPE_7,
    KI_SHAPE_9,
    KI_SHAPE_10,
    KI_SHAPE_11,
    KI_SHAPE_12,
    KI_SHAPE_13,
    KI_SHAPE_14,
    KI_SHAPE_15,
    KI_SHAPE_16,
    KI_SHAPE_17
  ]
}
