---
name: ki-authoring
implies: []
vendors: [educate, audit, conform, help]
owns: ['.prettierrc.json', '.editorconfig', '.markdownlint-cli2.jsonc']
description: >
  The foundational authoring and formatting conventions shared across every Knowledge Islands skill, repo, and base — the common style layer the others build on rather than restate. Currently covers Markdown authoring (wide tables → footnotes, link style) and TOML formatting style (for the shared `.ki-config.toml`). Use when writing or editing Markdown or TOML, bringing a document, README, table, or config to house style (conform), checking one against the conventions (audit), or refreshing them against their sources. Triggers: "format this to our style", "fix this markdown", "tidy this README", "audit this doc's formatting", "does this follow house style", "what's our convention for tables / links / footnotes". For KB note-writing use the `ki-kb` skill; for a repo's configuration and the `.ki-config.toml` contract use `ki-repo`; to judge a SKILL.md use `ki-skills`; for the build/lint/test toolchain use `ki-engineering`.
argument-hint: 'audit <path> | conform <path> | help | educate <target> | refresh'
---

# Knowledge Islands authoring conventions

You are applying the **Knowledge Islands authoring conventions** — the foundational authoring and formatting rules every other skill, repo, and base in this work builds on rather than restates. Conventions are a common theme across the skill set; this skill is the one place they live, so the rest can assume them. It is the **single source of truth**: a repo's or base's `CLAUDE.md` carries a one-line pointer here instead of restating the rules, keeping the always-on layer small and the detail in one versioned place.

This is a **standard, base-agnostic Process skill** — it hard-codes no single base and assumes no knowledge-base structure. Install it anywhere the conventions should apply. How it sits alongside the other skills in this repository, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`, not repeated here.

## The two layers

A convention is one of two kinds, and the distinction decides where it lives — never restate a mechanically-enforced rule here:

- **Mechanical** — deterministically enforced by the house toolchain, so you never hand-apply it. This skill **owns `.prettierrc.json`, `.editorconfig`, and `.markdownlint-cli2.jsonc` wholly** (SHAPE-16 `owns:` — CONFORM scaffolds any of them when missing and unconditionally overwrites on drift, since none has legitimate per-repo content; AUDIT hash-compares each against the house template). **Prettier + markdownlint-cli2** own Markdown (prose wrapping, bullet/quote characters, heading hierarchy, single H1, spacing — `proseWrap: "never"` means Prettier joins any broken prose lines back to single paragraphs); run `bun run ki:authoring:audit` / `:conform`. **Biome** owns TS/JSON. Nothing in the toolchain formats **TOML**, so its conventions are entirely the judgment layer below.
- **Judgment** — needs a person or model deciding: when a wide table should spill into footnotes, whether link text is descriptive, how a `.ki-config.toml` reads. The toolchain cannot assess these. **This is what this skill carries.**

So the workflow when authoring or tidying Markdown is: write to the judgment conventions, then run `bun run ki:authoring:conform` to settle everything mechanical. TOML has no such mechanical pass — the convention is all there is.

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE scaffolds no artifact of its own. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The conventions each mode acts on are the **Convention sets** below; the checkable criteria are in [the rubric](references/audit-rubric.md).

### Mode AUDIT — check a document against house style

1. **Run the mechanical checker** — `bun scripts/audit.ts <repo-path>` (or `bun run ki:authoring:audit <repo-path>` at the harness root). It runs Prettier + markdownlint directly, so the check is self-sufficient in any repo, with or without `ki-engineering`/`package.json`. It also surfaces the judgment-layer `[J]` criteria as ADVISORY findings so they are named and visible in CI even though they require a reviewer. Exit code is non-zero on any FAIL.
2. Apply the **judgment** (`[J]`) criteria from [the rubric](references/audit-rubric.md) — the ADVISORY findings from step 1 name each one. Wide tables that should spill to footnotes, non-descriptive link text, a `.ki-config.toml` that reads poorly. TOML has no mechanical pass — the rubric is all of it.
3. **Report** by location → criterion → fix; lead with FAIL findings, then judgment findings.

### Mode CONFORM — bring a document into house style

1. Apply the judgment transforms in place — wide tables → footnotes (the marker series), descriptive link text, tidy TOML — per the Convention sets.
2. Run `bun run ki:authoring:conform` (or the standalone `conform.ts`) to settle the mechanical layer (table alignment and transient `MD052`/`MD060` until references and alignment land).
3. Re-run until `ki:authoring:audit` is clean and the judgment criteria pass.

### Mode EDUCATE — vendor the style gate, scaffold the owned files

EDUCATE vendors this skill's declared mechanical unit (the frontmatter `vendors:` declaration) into the target's `.ki-meta/` via the central bootstrap chain: [`scripts/educate.ts`](scripts/educate.ts) is a thin delegator into the `ki-bootstrap` engine. The `.prettierrc.json`/`.editorconfig` scaffold-or-correct itself lives in CONFORM (mirroring `ki-engineering`'s EDUCATE/CONFORM split — EDUCATE wires the checker in, CONFORM does the actual file write), so a fresh target only gets both files on its first `ki:authoring:conform` run.

### Mode REFRESH — re-anchor the conventions to their sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

The house conventions sit on top of external tools and specs (CommonMark, Prettier, markdownlint, the TOML spec), which move. Run on its declared cadence (see `references/sources.md`), or when asked "are the authoring conventions current".

1. **Read [the source list](references/sources.md)** — each tracked source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and diff against the convention references: a changed Prettier/markdownlint default that shifts what's mechanical, a CommonMark/TOML change, a rule worth adopting.
3. **Propose a diff** to the convention references (and this skill); confirm before writing.
4. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block (what's confirmed, open watch-items). What changed goes in the commit, not a changelog.

## Convention sets

Each set is a self-contained reference, loaded on demand. Read the one relevant to what you are writing.

- **[Markdown authoring](references/markdown-authoring.md)** — wide tables → footnotes (with the marker series), link style, and what to leave to the linter. The footnote-marker series, in order, is `†` `‡` `§` `¶` `‖` (then doubled: `††` `‡‡` `§§` `¶¶` `‖‖`), reset per table — omitting `*`, which collides with markdown emphasis; where one table needs two footnote categories, a visually distinct second series `※` `❡` `¤` `¥` separates them. (Stated here so it is reachable without opening the reference; the worked example, gotchas, and rationale stay in the reference.)
- **[TOML formatting](references/toml-config.md)** — key case, quoting, and comments for the shared `.ki-config.toml` (its _contract_ is `ki-repo`'s).
- **[Worked exemplars](references/exemplars.md)** — annotated illustrations of the conventions in practice: the footnote-marker series and table spill, relative-link style, and a well-formed `.ki-config.toml` table. Reach for these when a rule's application is a judgment call.

Out of scope by design, with their natural homes:

- **KB note-writing conventions** (zones, frontmatter, routing) → the `ki-kb` skill.
- **Commit and PR conventions, a repo's configuration, and the `.ki-config.toml` _contract_** (the compliance marker + one-table-per-skill model) → the `ki-repo` skill. This skill owns only the TOML _formatting_ style every such table is written in.
- **SKILL.md authoring** (frontmatter, description, body altitude) → the `ki-skills` skill.

## Adding a convention set

Keep this skill a thin router so growth has one obvious shape:

1. Add `references/<set-name>.md` holding the **judgment** rules only — state each rule with its _why_, and name what is left to the mechanical toolchain.
2. Add one row to the **Convention sets** table above with a one-line "covers" and the link.
3. Update the `description`'s "Currently covers …" clause so the new set surfaces at selection time.

Mutually-exclusive sets stay in separate files so an unrelated set never loads. If a set has a clear off-ramp to another skill, name it in the "Out of scope" list rather than absorbing it here.
