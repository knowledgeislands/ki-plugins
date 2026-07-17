# Homebrew tap standard

The quotable standard behind the [ki-homebrew-tap](../SKILL.md) skill and its [Audit Rubric](audit-rubric.md). This skill **wraps Homebrew's external standard** — the [Formula Cookbook][cookbook], `brew audit`, and `brew style` — rather than inventing a house one. What this document adds on top of Homebrew is only the **tap-shape** conventions: the layout every Knowledge Islands tap shares and the sourcing rule. Where a rule is Homebrew's own, it is labelled _(spec)_; where it is a KI tap-shape convention, _(shape)_. The tracked upstream sources are in [sources.md](sources.md).

## Contents

- [What a tap is](#what-a-tap-is)
- [The name is fixed by Homebrew](#the-name-is-fixed-by-homebrew)
- [Repo layout](#repo-layout)
- [Formula shape](#formula-shape)
- [Sourcing — versioned tarball, never HEAD](#sourcing--versioned-tarball-never-head)
- [The README formulae table](#the-readme-formulae-table)
- [CI — brew test-bot](#ci--brew-test-bot)
- [Config marker](#config-marker)
- [What `brew` checks that this skill does not](#what-brew-checks-that-this-skill-does-not)

## What a tap is

A Homebrew **tap** is a git repository of formulae. A repo becomes a tap by carrying a `Formula/` directory with one or more `*.rb` formula files _(spec)_. Knowledge Islands keeps a single tap, `homebrew-tap`, that distributes the `tools-*` command-line tools; each tool gets one formula _(shape)_. An applicable tap with no `Formula/*.rb` fails rather than warns.

Checker applicability is declaration or structure: `[ki-homebrew-tap]` in `.ki-config.toml` or a root `Formula/` directory activates the complete audit. With neither, the checker reports one `NA` and stops. A declared repository with no `Formula/`, and a structurally marked but empty `Formula/`, remain applicable failures; an undeclared repository with `Formula/` remains applicable and surfaces the missing marker.

## The name is fixed by Homebrew

The repository must be named `homebrew-<x>` _(spec)_. Homebrew strips the `homebrew-` prefix so that `brew tap <owner>/<x>` and `brew install <owner>/<x>/<formula>` resolve to it — `knowledgeislands/tap` is the `homebrew-tap` repo, and no explicit `brew tap` is needed before an install. Because the name is an external constraint, this skill governs the tap's **shape, not its name**; do not treat the `homebrew-` prefix as something to conform.

## Repo layout

```text
homebrew-tap/
├── Formula/
│   └── <tool>.rb           # one formula per tool; filename = formula name (shape)
├── README.md               # a "## Formulae" table (shape)
├── .github/workflows/      # OPTIONAL brew test-bot (shape)
├── LICENSE                 # ki-repo's
└── .ki-config.toml          # [ki-repo] + [ki-homebrew-tap] (shape)
```

The README, LICENSE, `.gitignore`, and GitHub settings are **`ki-repo`'s**, not this skill's — this skill checks only the tap-specific delta (the `Formula/` dir, the formula shape, the formulae table, the sourcing rule).

## Formula shape

A formula is a Ruby class Homebrew evaluates. The required parts _(spec — Homebrew rejects a formula missing them)_:

| Part          | Rule                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `class`       | `class <CamelCase> < Formula`; the class name is the formula name camelised.                    |
| `desc`        | One-line description, **≤ 80 chars**, and **not** starting with "A ", "An ", or "The ".         |
| `homepage`    | The tool's canonical URL (its source repo).                                                     |
| `url`         | A versioned release tarball (see below).                                                        |
| `sha256`      | The SHA-256 of that exact tarball.                                                              |
| `license`     | An SPDX identifier (e.g. `"MIT"`).                                                              |
| `def install` | Installs the built artifact(s), e.g. `bin.install "bin/mgit"`.                                  |
| `test do`     | Exercises the **installed** binary — asserts on `--version`/`--help` output, not a stub `true`. |

The `desc` length and article rules are `brew style`'s; the checker mirrors them as `TAP-DESC-STYLE` so they are caught even when `brew` is not on PATH. Everything finer (interpolation style, `bin`/`libexec` idioms, dependency declarations) is left to `brew audit`/`brew style`.

## Sourcing — versioned tarball, never HEAD

`url` MUST point at a **tagged-release tarball** — `https://github.com/<owner>/<repo>/archive/refs/tags/vX.Y.Z.tar.gz` or a `/releases/download/…` asset — paired with the `sha256` of that tarball _(shape, reinforcing Homebrew's stable-formula guidance)_. A formula that installs from a branch or `head "…"` alone is unreproducible; a stable formula pins a version. The version in the tag drives `#{version}` in the formula, so the `test do` block's `--version` assertion stays honest.

## The README formulae table

The README carries a `## Formulae` table listing **every** formula, its description, and a link to its source `tools-*` repo _(shape)_:

```markdown
| Formula | Description                         | Source                                        |
| ------- | ----------------------------------- | --------------------------------------------- |
| `mgit`  | Run commands across many git repos. | [tools-mgit](https://github.com/…/tools-mgit) |
```

Every `Formula/*.rb` must appear in this table (checker `TAP-README`); a formula the table omits is an undiscoverable install.

## CI — brew test-bot

A tap MAY carry a `.github/workflows/` job running [`brew test-bot`][testbot] — Homebrew's own CI action that runs `brew audit`, `brew style`, and `brew install` on each changed formula per PR _(shape, OPTIONAL)_. It is the backstop that runs the `brew` checks in an environment where Homebrew is guaranteed present, so a machine auditing the tap without `brew` installed still has coverage. The checker notes its absence only indirectly (by SKIPping the local `brew` checks); it does not FAIL a tap for lacking test-bot.

## Config marker

The tap opts into governance with a keyless `[ki-homebrew-tap]` table in `.ki-config.toml`, alongside `[ki-repo]` _(shape)_. It is **validate-down**: presence is the whole config, any key under it is unknown and WARNed (the tap's shape is fixed by Homebrew, so there is nothing to tune). Run `bun scripts/audit.ts --educate` to print the default block.

## What `brew` checks that this skill does not

When `brew` is on PATH the checker runs `brew style <formula>` and `brew audit --strict <formula>` and surfaces their findings (WARN) — so the deep formula rules (dependency correctness, `bin`/`libexec` conventions, deprecated DSL, mirror/livecheck hygiene, RuboCop style) are Homebrew's to enforce, not restated here. This skill's own checks are the ones `brew` **cannot** make: that the tap has a `Formula/` dir at all, that a versioned tarball (not HEAD) is used, that the README lists the formula, and that the `[ki-homebrew-tap]` marker is present. When `brew` is absent, only the shape checks run and the deep checks are the tap's CI's job.

[cookbook]: https://docs.brew.sh/Formula-Cookbook
[testbot]: https://docs.brew.sh/Brew-Test-Bot
