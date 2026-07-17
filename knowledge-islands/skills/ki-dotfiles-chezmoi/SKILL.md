---
name: ki-dotfiles-chezmoi
implies: [ki-authoring]
vendors: [educate, audit, conform, help]
description: >
  Codify, audit, and conform the chezmoi dotfiles-management standard — naming-prefix semantics, edit-source-not-target discipline, shell-loader layering, the bin/ dispatcher pattern, app-mutated-config handling (surgical patch vs full-template reverse-merge), format-preserving config editor selection, single-source-to-multi-target config templating, repo-local-vs-user-level CLAUDE.md layering, and chezmoi-specific repo-shape and OS gotchas. Use when auditing or authoring a chezmoi source repo, deciding how to manage or surgically edit an app-mutated config file, structuring shell config or a bin/ directory, or checking dotfiles conventions are followed. Triggers: "chezmoi standard", "audit my chezmoi repo", "how should I manage this dotfile", "surgical patch or reverse-merge", "preserve config comments", "dotfiles conventions". Not for a specific repo's own personal tool choices (its exact scripts, taps, MCP servers) — those belong in that repo's own `CLAUDE.md`, not this skill.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# The chezmoi dotfiles-management standard

You are applying the **chezmoi dotfiles-management standard** — house conventions for structuring and operating a [chezmoi](https://www.chezmoi.io/) source-state repository, on top of what chezmoi itself already enforces. A **chezmoi-managed repo** is any git repository that is chezmoi's source directory: detect it by the presence of `.chezmoiroot`, `.chezmoi.toml.tmpl`, a `.chezmoidata/` directory, or any `dot_*`/`private_*`/`executable_*`-prefixed file at the tree root. The rationale lives in [the standard](references/dotfiles-standard.md); the line-by-line checkable criteria (mechanical vs judgment) are in [the rubric](references/audit-rubric.md); where the standard's claims come from is in [the sources list](references/sources.md).

This is a **standard, repo- and application-agnostic governance skill** — it hard-codes no specific dotfiles content and assumes no particular set of managed applications. It names general-purpose format editors where a reusable default is justified; a repo's exact scripts and package choices remain local. Install it in any chezmoi source repo. How it sits alongside the other skills in this repository is documented once in the `ki-agentic-harness` `README.md`, not repeated here.

**Origin note:** this standard was reverse-engineered from a single real chezmoi repo (a personal dotfiles source tree audited 2026-07-12) — it is an n=1 case study, not a corpus of many repos the way `ki-repo`'s standard was. Treat the mechanical criteria as solid (they check chezmoi's own documented tool behavior) but the judgment criteria as provisional until more repos have been audited against this skill — see [the sources list](references/sources.md) for the honest scoping.

## The standard at a glance

- **Repo layout & naming** — the `dot_`/`executable_`/`private_`/`.tmpl` prefix system and how prefixes stack; the `bin/` executable convention; `.chezmoiignore` negation-through-ignored-parents; the `chezmoi doctor/status/managed/unmanaged` health-check workflow.
- **Edit discipline** — edit the source, never the rendered target; resolve via `chezmoi source-path`/`chezmoi target-path`.
- **Shell configuration** — rc files as thin loaders over numbered, load-order-prefixed config files, never accreting config inline.
- **bin/ dispatcher pattern** — a single bootstrap entrypoint dispatching `{install|update|cleanup|backup}` across independent, self-contained subsystem scripts.
- **App-mutated config handling** — Pattern A (surgical patch) vs Pattern B (full template + reverse-merge), with a decision rule and format-preserving editor selection for surgical writes.
- **Single-source, multi-target templating** — one structured data file rendered into several per-target config fragments via a shared template partial.
- **CLAUDE.md / agent-instruction layering** — repo-local vs user-level, and how to choose between them (and memory).
- **OS/tooling gotchas** — macOS case-insensitive filesystems; `sed` and non-ASCII characters.
- **Git & audit hygiene** — lock-file discipline; audit via skills, not hand-rolled shell; report-then-confirm etiquette.

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for the target path the chosen mode's `argument-hint` shows.

### Mode AUDIT — check a chezmoi repo against the standard

1. **Run the mechanical checker** — `bun scripts/audit.ts <repo-path>`. It checks the four **[M]** criteria in [the rubric](references/audit-rubric.md) (`.chezmoiignore` presence, `.chezmoidata`/`.chezmoitemplates` presence when `.tmpl` files exist, `bin/` executable-prefix conformance, git lock-file hygiene) and surfaces every **[J]** criterion as an ADVISORY finding so it is named and visible even though it needs a reader. Exit code is non-zero on any FAIL.
2. Apply the **judgment** (`[J]`) criteria the ADVISORY findings name — Pattern A/B correctness for a given app config, format-preserving editor selection and evidence for every surgical writer, CLAUDE.md Layer 1/2 placement quality, `.chezmoiignore` negation intent, and whether audit-reporting etiquette was actually followed.
3. **Report** by location → criterion → fix; lead with FAIL findings, then judgment findings; present options, don't silently fix.

### Mode CONFORM — bring a repo into house shape

1. `bun scripts/conform.ts <repo-path>` scaffolds `.chezmoiignore` if it's missing — the one criterion with no legitimate reason to be absent and no per-repo content to preserve.
2. Everything else in the standard is judgment-driven and is **not** auto-fixed: restructuring shell config into the loader pattern, choosing Pattern A vs B for a given app config, selecting and proving a format-preserving surgical editor, moving CLAUDE.md content between layers, and so on are manual procedures — CONFORM prints them as TODOs (see [the rubric](references/audit-rubric.md)'s `[J]` list) rather than guessing.
3. Re-audit until `scripts/audit.ts` is clean and the judgment criteria are satisfied.

### Mode EDUCATE — vendor the checker into a target repo

EDUCATE vendors this skill's declared mechanical unit (the frontmatter `vendors:` declaration) into the target's `.ki-meta/` via the central `ki-bootstrap` chain: [`scripts/educate.ts`](scripts/educate.ts) is a thin delegator into that engine, matching every other governance skill's EDUCATE.

### Mode REFRESH — re-anchor the standard to its sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it.

chezmoi's own documented behavior (naming semantics, `.chezmoiignore`, `run_onchange_` scripts, health-check commands) and the selected format editors' documented APIs are the authoritative tool-behavior layer; the house-convention layer on top of them (shell-loader pattern, the two app-mutated-config patterns, editor-selection and verification policy, the templating pattern) is this skill's own judgment and should be re-anchored as tools change and more repos are audited against it. Run on the declared cadence (see [the sources list](references/sources.md)), or when asked "is the chezmoi standard current".

1. **Read [the source list](references/sources.md)** — each tracked source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and diff against [the standard](references/dotfiles-standard.md): changed chezmoi naming/templating behavior, a new `run_onchange_` capability, a changed format-editor preservation contract, or a pattern this standard has not captured yet.
3. **Propose a diff** to the standard and rubric; confirm before writing.
4. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.

## Out of scope, with natural homes

- **A specific repo's own personal tool choices** (its exact managed dotfiles, its specific bin scripts, its specific Homebrew taps, its specific MCP/app server list) — those stay in that repo's own `CLAUDE.md`/topic files; this skill only ever generalizes.
- **Generic repo shape** (README/LICENSE/.gitignore, GitHub settings) → the `ki-repo` skill; this skill is additive on top of it for the chezmoi-specific files (`.chezmoiignore`, `.chezmoidata/`, `.chezmoitemplates/`).
- **Markdown/TOML authoring style** → the `ki-authoring` skill (`implies:` above).
