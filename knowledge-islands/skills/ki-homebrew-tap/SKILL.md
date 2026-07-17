---
name: ki-homebrew-tap
implies: []
vendors: [educate, audit, conform, help]
description: >
  Codify, audit, and scaffold the Knowledge Islands Homebrew tap — the `homebrew-<x>` distribution repo that holds `Formula/*.rb` for Knowledge Islands command-line tools. This skill WRAPS Homebrew's external standard (the Formula Cookbook + `brew audit`/`brew style`) rather than inventing a house one: it checks the tap's shape (a `Formula/` dir, one formula per tool, the README formulae table, a versioned-tarball source) and delegates formula-correctness to `brew` when it is on PATH. Use when auditing the tap, adding a formula, scaffolding a new tap, or refreshing against Homebrew's rules. Triggers: "audit the homebrew tap", "add a formula", "does the tap follow Homebrew's standard", "scaffold a homebrew tap", "is this formula valid", "refresh the homebrew-tap standard". Governs the tap **container** — the repo shape and the formula shape — not the tools themselves (for a `tools-*` CLI repo use `ki-tools`) nor the repo's GitHub settings and standard files (for those use `ki-repo`).
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands Homebrew tap standard

You are helping audit, conform, or scaffold the **Homebrew tap** repo — `homebrew-tap` under `knowledgeislands/`, the distribution repo that carries `Formula/*.rb` so `brew install knowledgeislands/tap/<tool>` resolves. The tools whose formulae live here are governed by the sibling `ki-tools` skill; this skill governs the **tap** and the **formulae inside it**.

This skill **wraps an external standard.** Homebrew already defines what a valid tap and formula are (the Formula Cookbook, `brew audit`, `brew style`); this skill does not re-invent that. It checks the tap's **shape** — the things a tap needs beyond a single valid formula — and, where `brew` is installed, hands formula-correctness straight to `brew audit --strict` / `brew style`. So a finding is either **shape** (this skill's house convention for the tap: a `Formula/` dir, a README formulae table, a versioned-tarball source) or **spec** (Homebrew's own rule, surfaced by `brew`). Never present a shape preference as a Homebrew "MUST"; when unsure which a rule is, run Mode REFRESH against the Cookbook.

The full, quotable standard lives in [Homebrew tap standard](references/homebrew-tap-standard.md); the line-by-line pass/fail items in [Audit Rubric](references/audit-rubric.md). The mechanical checker is [`scripts/audit.ts`](scripts/audit.ts). Read those when you need detail; this file is the operating procedure.

## The canonical shape at a glance

```text
homebrew-tap/            # named homebrew-<x> — Homebrew requires the prefix for `brew tap <owner>/<x>`
├── Formula/
│   ├── mgit.rb          # one formula per tool, filename = formula name
│   └── <tool>.rb
├── README.md            # a "## Formulae" table listing every formula + its source repo
├── .github/workflows/   # OPTIONAL brew test-bot CI (brew audit/style/install on PR)
└── .ki-config.toml       # [ki-repo] + [ki-homebrew-tap] (keyless opt-in marker)
```

A single formula (`Formula/mgit.rb`) is a Ruby class Homebrew evaluates:

```ruby
class Mgit < Formula
  desc "Run a git command across many repositories at once"  # ≤ 80 chars, no leading A/An/The
  homepage "https://github.com/knowledgeislands/tools-mgit"
  url "https://github.com/knowledgeislands/tools-mgit/archive/refs/tags/v0.1.0.tar.gz"  # versioned tarball
  sha256 "092a6df6…"                                          # of that tarball
  license "MIT"

  def install
    bin.install "bin/mgit"
  end

  test do
    assert_match "mgit #{version}", shell_output("#{bin}/mgit --version")
  end
end
```

Three rules define a well-formed tap — most findings are a violation of one:

1. **The tap is `Formula/*.rb`, one formula per tool.** The directory `Formula/` with at least one `.rb` is what makes a repo a tap; the filename is the formula name (`Formula/mgit.rb` → `brew install …/mgit`). No `Formula/` is a hard FAIL — it is not a tap.
2. **A formula sources a versioned release, never HEAD.** `url` points at a tagged-release tarball (`/archive/refs/tags/vX.Y.Z.tar.gz` or `/releases/download/…`) with its matching `sha256`. Installing from a branch is unreproducible; that is a finding, not the shape.
3. **The formula has the seven required parts.** `class <Camel> < Formula`, `desc`, `homepage`, `url`, `sha256`, `license`, a `def install`, and a `test do` that exercises the installed binary. `brew audit`/`brew style` enforce the finer rules on top (this skill runs them when `brew` is present).

## The name is fixed by Homebrew

Unlike the other repo-structure skills, this skill does **not** govern the repo name. Homebrew requires a tap repo to be named `homebrew-<x>` so that `brew tap <owner>/<x>` and `brew install <owner>/<x>/<formula>` resolve to it (`knowledgeislands/tap` → the `homebrew-tap` repo). The skill governs shape, not name — treat the `homebrew-` prefix as an external constraint, not something to conform.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE here scaffolds a new tap. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Composition — what this skill rides and what it defers

This skill **rides `ki-repo`** (the tap is first a git repo: README, LICENSE, `.gitignore`, GitHub settings, security — all `ki-repo`'s) and declares that edge, but it does **not** ride `ki-engineering`: a tap has no `package.json`/TypeScript toolchain, so a bare `[ki-repo]` + `[ki-homebrew-tap]` config is complete (the `ki-plugins` precedent). It `implies:` nothing.

- The **tools** whose formulae live here — the `tools-*` CLI repos, their `bin/<exe>`, installer, versioning, and releases — are `ki-tools`'. This skill checks that a formula _exists and is well-formed_; whether the tool it installs is a conformant `tools-*` repo is `ki-tools`' audit.
- A tap **repo's** GitHub configuration and standard files (merge policy, topics, secret scanning, README/LICENSE presence) are `ki-repo`'s. This skill checks the tap-specific delta on top.

## Notes

- The standard sits on top of a **moving external spec** (Homebrew's Formula Cookbook, `brew audit`, `brew style`/rubocop). When citing a formula requirement, know whether it is **spec-driven** (traces to a Homebrew source in [the source list](references/sources.md)) or **house shape** — never present a tap-shape preference as a Homebrew "MUST". Run Mode REFRESH when in doubt.
- The checker **degrades gracefully**: when `brew` is absent it returns **NA** for the `brew audit`/`brew style` checks (the tap's own `brew test-bot` CI is the backstop) and still runs every shape check. A `brew` invocation error is caught and downgraded to NA, never a crash.
- Marker `[ki-homebrew-tap]` is a **keyless opt-in table**, validate-down (like `[ki-mcp]`): its presence is the whole config; any key under it is unknown and WARNed. Run the checker with `--educate` to print the default block.
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../../foundations/ki-engineering/references/checker-contract.md).
