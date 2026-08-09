---
name: ki-authoring
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
owns: ['.editorconfig', '.rumdl.toml']
description: >
  Defines Knowledge Islands Markdown, TOML, and knowledge-placement conventions. Use to format or audit Markdown or TOML, decide where a durable learning belongs, or refresh house style. Use `ki-skills` for a SKILL.md, `ki-repo` for a configuration contract, and `ki-engineering` for the toolchain.
argument-hint: 'audit <path> | conform <path> | educate <target> | help | refresh'
---

# Knowledge Islands authoring conventions

You are applying the **Knowledge Islands authoring conventions** — the foundational authoring and formatting rules every other skill, repository, and base in this work builds on rather than restates. Conventions are a common theme across the skill set; this skill is the one place they live, so the rest can assume them. It is the **single source of truth**: a repository's always-loaded orientation carries a one-line pointer here instead of restating the rules, keeping that standing context small and the detail in one versioned place.

This is a **standard, base-agnostic governance skill** — it hard-codes no single base and assumes no knowledge-base structure. Install it anywhere the conventions should apply. How it sits alongside the other skills in this repository, and where it must not overlap them, is documented once in the ki-agentic-harness `README.md`, not repeated here.

## The two layers

A convention is one of two kinds, and the distinction decides where it lives — never restate a mechanically-enforced rule here:

- **Mechanical** — deterministically enforced by the house toolchain, so you never hand-apply it. This skill **owns `.editorconfig` and `.rumdl.toml` wholly** (SHAPE-16 `owns:` — CONFORM scaffolds either when missing and transactionally overwrites regular files on drift; AUDIT hash-compares each against the house template and refuses unsafe file types). An evidenced exception belongs only in `[skills.ki-authoring.owned_file_exceptions]`: it names one owned file and a non-empty reason, remains a WARN, and suppresses only that regular drifted-file overwrite. It never creates a local template. The detailed boundary is in the [Authoring enforcement](references/standards-authoring.md) standard. The skill also removes the retired `.prettierrc.json`, `.prettierignore`, and `.markdownlint-cli2.jsonc`, because a leftover configuration lets an editor extension reformat Markdown against a standard the repository no longer holds. **rumdl** owns authored Markdown, formatting and linting it in one pass (prose wrapping, bullet/quote characters, heading hierarchy, single H1, spacing — `MD013` with `reflow-mode = "normalize"` at an unbounded width joins any broken prose lines back to single paragraphs); run `ki repo audit --skill ki-authoring` / `ki repo conform --skill ki-authoring`. **Biome** owns TS/JSON. Nothing in the toolchain formats **TOML** or aligns a Markdown table, so those conventions are entirely the judgment layer below.
- **Judgment** — needs a person or model deciding: when a wide table should spill into footnotes, whether link text is descriptive, how a `.ki-config.toml` reads. The toolchain cannot assess these. **This is what this skill carries.**

So the workflow when authoring or tidying Markdown is: write to the judgment conventions, then run `ki repo conform --skill ki-authoring` to settle everything mechanical. TOML has no such mechanical pass — the convention is all there is.

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE scaffolds no artifact of its own. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows. The conventions each mode acts on are the **Convention sets** below; the checkable criteria are in [the rubric](references/rubric.md).

### Mode AUDIT — check a document against house style

1. **Run the hosted structured checker** — `ki repo audit --skill ki-authoring --repo <repo-path>`. The catalogue prepares the formatter evidence with shell-free argument arrays, so the check is self-sufficient in a repository with or without `ki-engineering` or a `package.json`. The host owns findings, reporting, and the non-zero exit on any FAIL.
2. Apply the **judgment** (`[J]`) criteria from [the rubric](references/rubric.md) — the response summary counts them as unevaluated but does not manufacture findings for work a reviewer has not performed. Wide tables that should spill to footnotes, non-descriptive link text, a `.ki-config.toml` that reads poorly. TOML has no mechanical pass — the rubric is all of it.
3. **Report** by location → criterion → fix; lead with FAIL findings, then judgment findings. Trade records under `+/_TRADES/` and `-/_TRADES/` are authored Markdown like any other and are formatted with the rest. Their integrity is a property of meaning, not bytes: `ki-trades` `AUTH-1` compares a record against the sender's copy through a projection that ignores formatting, so formatting them changes nothing it checks. An exclusion list was the weaker guarantee — it only avoided touching the records, never verified them, and never covered Biome at all.

### Mode CONFORM — bring a document into house style

1. Apply the judgment transforms in place — wide tables → footnotes (the marker series), descriptive link text, tidy TOML — per the Convention sets.
2. Run `ki repo conform --skill ki-authoring --repo <repo-path>` to settle the mechanical layer (transient `MD052` until reference definitions land). Table alignment is **not** mechanical — no rumdl setting reproduces the former conditional padding, so keeping a table readable is judgment work. The owned-file item prepares early transactional writes; the Markdown item requests late formatter commands from the host.
3. Re-run AUDIT until the mechanical gate is clean and the judgment criteria pass.

### Mode EDUCATE — teach the conventions and their mechanical footprint

Run `ki repo educate --skill ki-authoring --repo <repo-path>` to render the registered rubric's concern and convention families. EDUCATE explains the Markdown and TOML judgment boundaries and names the two wholly owned configuration files. CONFORM, not EDUCATE, transactionally scaffolds or corrects those files and requests the Markdown normalisation commands.

### Mode REFRESH — re-anchor the conventions to their sources

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

The house conventions sit on top of external tools and specs (CommonMark, rumdl, the TOML spec), which move. Run on its declared cadence (see `references/sources.md`), or when asked "are the authoring conventions current".

1. **Read [the source list](references/sources.md)** — each tracked source with its `last reviewed` date.
2. **Re-fetch each** (WebFetch; fall back to WebSearch if a host is blocked or returns non-200) and diff against the convention references: a changed rumdl default that shifts what's mechanical, a CommonMark/TOML change, a rule worth adopting.
3. **Re-test every disabled rule** against the reproduction recorded for it under the source list's open watch-items, and re-enable the ones upstream has fixed. A rule is disabled because of a specific defect or a specific decision, never as a permanent verdict — left unexamined, a defensive setting outlives its defect and silently costs the coverage it was meant to protect. Run the reproduction rather than trusting a changelog: `MD075` corrupted files while reporting them clean, so upstream's own signal is not sufficient evidence.
4. **Propose a diff** to the convention references (and this skill); confirm before writing.
5. **Update [the source list](references/sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block (what's confirmed, open watch-items). What changed goes in the commit, not a changelog.

## Convention sets

Each set is a self-contained reference, loaded on demand. Read the one relevant to what you are writing.

- **[Authoring enforcement](references/standards-authoring.md)** — wholly owned configuration, the Markdown formatter/linter gate, and the safe hosted conform boundary.
- **[Markdown authoring](references/standards-markdown.md)** — wide tables → footnotes (with the marker series), link style, and what to leave to the linter. The footnote-marker series, in order, is `†` `‡` `§` `¶` `‖` (then doubled: `††` `‡‡` `§§` `¶¶` `‖‖`), reset per table — omitting `*`, which collides with markdown emphasis; where one table needs two footnote categories, a visually distinct second series `※` `❡` `¤` `¥` separates them. (Stated here so it is reachable without opening the reference; the worked example, gotchas, and rationale stay in the reference.)
- **[TOML formatting](references/standards-toml.md)** — key case, quoting, and comments for the shared `.ki-config.toml` (its _contract_ is `ki-repo`'s).
- **[Knowledge promotion](references/standards-knowledge-promotion.md)** — runtime-neutral placement, evidence, and reconciliation for durable learnings; it routes knowledge deliberately without mining transcripts or creating guide areas automatically.
- **[Worked exemplars](references/exemplars.md)** — annotated illustrations of the conventions in practice: the footnote-marker series and table spill, relative-link style, and a well-formed `.ki-config.toml` table. Reach for these when a rule's application is a judgment call.

Out of scope by design, with their natural homes:

- **KB note-writing conventions** (zones, frontmatter, routing) → the `ki-repo-kb` skill.
- **Commit and PR conventions, a repo's configuration, and the `.ki-config.toml` _contract_** (the compliance marker + one-table-per-skill model) → the `ki-repo` skill. This skill owns only the TOML _formatting_ style every such table is written in.
- **SKILL.md authoring** (frontmatter, description, body altitude) → the `ki-skills` skill.

## Adding a convention set

Keep this skill a thin router so growth has one obvious shape:

1. Add `references/standards-<topic>.md` holding the **judgment** rules only — state each rule with its _why_, justify why the topic deserves its own standard, and name what is left to the mechanical toolchain.
2. Add one entry to the **Convention sets** list above with a one-line "covers" and the link.
3. Update the `description`'s "Currently covers …" clause so the new set surfaces at selection time.

Mutually-exclusive sets stay in separate files so an unrelated set never loads. If a set has a clear off-ramp to another skill, name it in the "Out of scope" list rather than absorbing it here.
