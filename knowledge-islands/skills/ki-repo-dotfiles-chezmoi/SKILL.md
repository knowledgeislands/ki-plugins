---
name: ki-repo-dotfiles-chezmoi
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: [ki-authoring]
description: >
  Codifies, audits, and conforms the chezmoi dotfiles-management standard. Use for a chezmoi source repo, app-mutated configuration, shell or `bin/` layout, or preserving config comments. Covers source-vs-target editing, prefix semantics, fragment binding, and reverse merges; not a specific repo's personal tool choices.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# The chezmoi dotfiles-management standard

You are applying the **chezmoi dotfiles-management standard** — house conventions for structuring and operating a [chezmoi](https://www.chezmoi.io/) source-state repository, on top of what chezmoi itself already enforces. Only a physical `[skills.ki-repo-dotfiles-chezmoi]` declaration selects this optional standard. A **chezmoi-managed repo** can be detected by the presence of `.chezmoiroot`, `.chezmoi.toml.tmpl`, a `.chezmoidata/` directory, or any `dot_*`/`private_*`/`executable_*`-prefixed file at the tree root, but detection is coverage evidence for `ki-repo`, not a local audit result. The rationale lives in [the standard](references/standards-chezmoi-dotfiles.md); the line-by-line checkable criteria are in [the generated rubric](references/rubric.md); where the standard's claims come from is in [the sources list](references/sources.md).

This is a **standard, repo- and application-agnostic governance skill** — it hard-codes no specific dotfiles content and assumes no particular set of managed applications. It names general-purpose format editors where a reusable default is justified; a repo's exact scripts and package choices remain local. Install it in any chezmoi source repo. How it sits alongside the other skills in this repository is documented once in the `ki-agentic-harness` `README.md`, not repeated here.

**Origin note:** this standard was reverse-engineered from a single real chezmoi repo (a personal dotfiles source tree audited 2026-07-12) — it is an n=1 case study, not a corpus of many repos the way `ki-repo`'s standard was. Treat the mechanical criteria as solid (they check chezmoi's own documented tool behavior) but the judgment criteria as provisional until more repos have been audited against this skill — see [the sources list](references/sources.md) for the honest scoping.

No `exemplars.md` is bundled yet: the single source repo is evidence for provisional house conventions, not a sufficiently broad set of representative outcomes. Add exemplars only after the patterns recur across independently reviewed chezmoi repositories.

## The standard at a glance

- **Repo layout & naming** — the `dot_`/`executable_`/`private_`/`.tmpl` prefix system and how prefixes stack; the `bin/` executable convention; `.chezmoiignore` negation-through-ignored-parents; the `chezmoi doctor/status/managed/unmanaged` health-check workflow.
- **Edit discipline** — edit the source, never the rendered target; resolve via `chezmoi source-path`/`chezmoi target-path`.
- **Shell configuration** — rc files as thin loaders over numbered, load-order-prefixed config files, never accreting config inline; idempotent, conditional path setup and upstream-generated completions.
- **bin/ dispatcher pattern** — a single bootstrap entrypoint dispatching `{install|update|cleanup|backup}` across independent, self-contained subsystem scripts.
- **App-mutated config handling** — Pattern A (surgical patch), Pattern B (full template + reverse-merge), or Pattern C (native fragment binding), with a decision rule and format-preserving editor selection for writes.
- **Single-source, multi-target templating** — one structured data file rendered into several per-target config fragments via a shared template partial.
- **Agent-instruction layering** — repo-local vs user-level, and how to choose between them (and memory).
- **OS/tooling gotchas** — macOS case-insensitive filesystems; `sed` and non-ASCII characters.
- **Git & audit hygiene** — lock-file discipline; audit via skills, not hand-rolled shell; report-then-confirm etiquette.

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**.

### Mode HELP — orient without changing anything

Invoked as `help` / `-h` / `?`, it explains itself and stops: name, purpose, invocation, modes, and off-ramps, taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice and prompts for the target path the chosen mode requires.

### Mode AUDIT — check a chezmoi repo against the standard

1. **Run the hosted rubric** — `ki repo audit --repo <repo-path> --skill ki-repo-dotfiles-chezmoi`. It checks the four **[M]** criteria in [the rubric](references/rubric.md) (a physical `.chezmoiignore`, template support when `.tmpl` files exist, `bin/` source-prefix conformance, and physical Git lock-file hygiene). The result also counts the unevaluated **[J]** criteria, which a reader must apply separately. Exit code is non-zero on any FAIL.
2. Apply the **judgment** (`[J]`) criteria named in [the rubric](references/rubric.md) — Pattern A/B correctness for a given app config, format-preserving editor selection and evidence for every surgical writer, agent-guidance Layer 1/2 placement quality, shell-path and completion handling, `.chezmoiignore` negation intent, and whether audit-reporting etiquette was actually followed.
3. **Report** by location → criterion → fix; lead with FAIL findings, then judgment findings; present options, don't silently fix.

### Mode CONFORM — bring a repo into house shape

1. `ki repo conform --repo <repo-path> --skill ki-repo-dotfiles-chezmoi` explicitly creates `.chezmoiignore` only when the path is absent. The host publishes one create-only proposal; an existing file, directory, or symlink is never replaced.
2. Everything else in the standard remains report-only: restructuring shell config, choosing Pattern A/B/C, selecting and proving a format-preserving editor, moving agent guidance between layers, renaming source files, deleting locks, and running chezmoi all require repository-specific intent.
3. Re-audit until `ki repo audit --repo <repo-path> --skill ki-repo-dotfiles-chezmoi` is clean and the judgment criteria are satisfied.

### Mode EDUCATE — add the capability to a target repo

Run `ki repo educate --skill ki-repo-dotfiles-chezmoi --repo <target>` to explain the standard and its mechanical footprint after the capability is declared. Repository activation remains owned by the KI CLI; this skill supplies the standard and rubric contract.

### Mode REFRESH — re-anchor the standard to its sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it.

chezmoi's own documented behavior (naming semantics, `.chezmoiignore`, `run_onchange_` scripts, health-check commands) and the selected format editors' documented APIs are the authoritative tool-behavior layer; the house-convention layer on top of them (shell-loader pattern, the two app-mutated-config patterns, editor-selection and verification policy, the templating pattern) is this skill's own judgment and should be re-anchored as tools change and more repos are audited against it. Run on the declared cadence (see [the sources list](references/sources.md)), or when asked "is the chezmoi standard current".

1. **Read [the source list](references/sources.md)** — each tracked source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and diff against [the standard](references/standards-chezmoi-dotfiles.md): changed chezmoi naming/templating behavior, a new `run_onchange_` capability, a changed format-editor preservation contract, or a pattern this standard has not captured yet.
3. **Propose a diff** to the standard and rubric; confirm before writing.
4. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.

## Out of scope, with natural homes

- **A specific repo's own personal tool choices** (its exact managed dotfiles, its specific bin scripts, its specific Homebrew taps, its specific MCP/app server list) — those stay in that repo's own `CLAUDE.md`/topic files; this skill only ever generalizes.
- **Generic repo shape** (README/LICENSE/.gitignore, GitHub settings) → the `ki-repo` skill; this skill is additive on top of it for the chezmoi-specific files (`.chezmoiignore`, `.chezmoidata/`, `.chezmoitemplates/`).
- **Markdown/TOML authoring style** → the `ki-authoring` skill (`ki-depends-on:` above).
