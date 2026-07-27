---
name: ki-feature-definitions
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify, audit, and maintain Feature Definitions — the behaviour-level specification of what a system does — in any Knowledge Islands repo. Definitions live in `docs/features/`, flat one-file-per-area, with an `index.md` that defines the ID scheme and the areas table. Each requirement is a `### <PREFIX>-NNN — title` heading carrying one RFC-2119 (MUST / SHOULD / MAY) statement and a `_Verify:_` test hook; IDs are append-only and never reused; an unnumbered `## Gaps` section holds the backlog. Decisions capture the why (`ki-decision-records`), features capture the what, guides capture the how. Use when writing, auditing, or conforming a feature spec, or seeding one for a repo. Triggers: "write a feature definition", "spec this behaviour", "audit the features", "add a requirement", "what does the system do". Off-ramps: ki-decision-records (the governing decisions a requirement cites), ki-authoring (Markdown/TOML style).
argument-hint: 'audit [dir] | conform [dir] | help | educate [dir] | new <area> "<title>" | refresh'
---

# Knowledge Islands Feature Definitions standard

You are applying the **Knowledge Islands Feature Definitions standard** — how a system's behaviour is written down as a testable, append-only contract. A Feature Definition is the **what**: the behaviour a built system exhibits, stated normatively and paired with a verification hook, so a test suite or reader can check the system against it. It sits between the **why** (Decision Records, `ki-decision-records`) and the **how** (guides). Read the [Feature Definitions standard](references/standards-feature-definitions.md) before authoring, auditing, or conforming a corpus; the [rubric](references/rubric.md) publishes its checkable criteria, [exemplars](references/exemplars.md) illustrate representative shapes, and [sources](references/sources.md) records provenance.

## What this skill owns

1. **The layout** — Feature Definitions live in `docs/features/`, **flat, one file per area** (e.g. `authentication.md`, `site-seo.md`). An `index.md` is the overview: purpose, how-to-read, the ID scheme, the Gaps convention, and the **areas table**.
2. **The areas table** — in `index.md`, a table whose rows map an **area file** to its **prefix** (and a short "covers" blurb). A file may host more than one prefix; a prefix belongs to exactly one file. This table is the registry the checker validates IDs against.
3. **The ID scheme** — every requirement is a level-3 heading `### <PREFIX>-NNN — <title>`: `PREFIX` is one or more uppercase alpha-leading segments (e.g. `AUTH`, `SITE-SEO`); `NNN` is zero-padded (≥ 3 digits), sequential within the file. IDs are **append-only and never reused** — a retired requirement keeps its number, struck through with a `(deprecated)` note; never renumber to tidy up.
4. **The requirement shape** — under each heading, one **RFC-2119** normative statement (`MUST` / `MUST NOT` / `SHOULD` / `SHOULD NOT` / `MAY`, uppercase) describing the behaviour, then a `_Verify:_` line naming the built-output assertion, test, or source symbol that confirms it.
5. **The Gaps backlog** — each area file may end with a `## Gaps` section (heading may extend, e.g. `## Gaps & candidate behaviours`) of **unnumbered** bullets: known divergences or desirable-but-unbuilt behaviours, deliberately ID-less so they sit outside the as-built contract. Promote a gap to a numbered requirement only once it is built and true.
6. **The decision link** — Decision Records capture the why; the spec follows. A requirement governed by a recorded decision **cites its DR** (a link into `../decisions/`). This is judgment, not mechanical — the checker does not force it.
7. **The mechanical checker** — `ki repo audit --skill ki-feature-definitions` validates the index and areas table, requirement heading IDs, registered prefixes, append-only uniqueness, normative keywords, and `_Verify:_` lines while exempting Gaps and deprecated entries.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**, plus **NEW** (draft a new requirement or area). Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode EDUCATE

→ Activate this skill with `ki skill repo add ki-feature-definitions`; the hosted EDUCATE mode renders its concern and rubric. Use [NEW](references/mode-new.md) to author the first area and index from the exemplars.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode NEW

→ Read [references/mode-new.md](references/mode-new.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Notes

- **What vs why vs how** — a requirement states behaviour, not rationale (that is a DR) and not procedure (that is a guide). If a statement explains _why_, move the reasoning to a DR and cite it.
- **As-built, not aspirational** — the numbered contract describes what the system **does** today; anything not yet true belongs in `## Gaps` until it is built. This keeps the spec a baseline a test suite can hold the system to.
- **One normative clause per requirement, ideally** — a requirement may carry a `MUST` and a paired `MUST NOT`, but a heading that bundles several unrelated behaviours should split into separate IDs so each verifies independently.
- **Serials are per prefix** — `AUTH-001` and `SITE-001` are both valid; a serial is unique within its prefix. Never reuse a retired number.
- The `ki` host owns findings, dry-run publication, rollback, reporting, and post-conform verification; judgment aspects are counted as unevaluated rather than emitted as synthetic findings.
