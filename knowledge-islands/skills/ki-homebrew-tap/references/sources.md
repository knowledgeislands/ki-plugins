# Sources — where the standard comes from

**Refresh:** external-spec · quarterly

The authoritative Homebrew sources behind the [Homebrew tap standard](homebrew-tap-standard.md) and [Audit Rubric](audit-rubric.md). This skill **wraps an external standard**: Homebrew defines what a valid tap and formula are, and the in-house standard is only the tap-**shape** layer on top. Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + rubric + [`scripts/audit.ts`](../scripts/audit.ts), then **bumps the `Last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

A finding is only **spec-driven** if it traces to the Authoritative table (Homebrew's own rules); everything else is this skill's tap-shape convention and should be labelled as such so it is not mistaken for a Homebrew requirement.

## Authoritative (Homebrew)

| Tag      | Source                                       | Governs | Last reviewed |
| -------- | -------------------------------------------- | ------- | ------------- |
| COOKBOOK | [Formula Cookbook][cookbook]                 | †       | 2026-07-09    |
| AUDIT    | [`brew audit` command reference][audit]      | ‡       | 2026-07-09    |
| STYLE    | [`brew style` / rubocop formula cops][style] | §       | 2026-07-09    |
| ACCEPT   | [Acceptable Formulae][acceptable]            | ¶       | 2026-07-09    |
| TAP      | [Taps (third-party repositories)][taps]      | ‖       | 2026-07-09    |
| TESTBOT  | [Brew Test Bot][testbot]                     | ※       | 2026-07-09    |

† The required formula parts (`class < Formula`, `desc`, `homepage`, `url`, `sha256`, `license`, `install`, `test do`) and their idioms — the source of `TAP-CLASS`/`TAP-FIELDS`.

‡ What `brew audit --strict` enforces — delegated to via `TAP-BREW` when `brew` is on PATH.

§ The `desc` rules (≤ 80 chars, no leading "A"/"An"/"The") and RuboCop formula cops — the source of `TAP-DESC-STYLE`, mirrored so it fires without `brew`.

¶ Whether a tool is eligible for a formula (notability, stable release, versioned source) — background for the sourcing rule.

‖ How a tap repo is named (`homebrew-<x>`) and resolved by `brew tap`/`brew install` — the source of the fixed-name constraint.

※ The `brew test-bot` CI action a tap MAY run — the backstop when a local audit has no `brew`.

## Last review

REFRESH last run **2026-07-09** (initial authoring). The standard was written against the live Homebrew documentation as of this date and against the reference tap `knowledgeislands/homebrew-tap` (`Formula/mgit.rb`). No prior review to diff against.

**Open watch-items:**

- **Homebrew is a live target.** The Cookbook and `brew audit`/`brew style` cops change without a versioned spec release — hence the `quarterly` cadence rather than `on-change`. Re-diff the required-fields list and the `desc` cops each cycle.
- **`TAP-DESC-STYLE` is a mirror.** The ≤ 80-char + no-leading-article rule is copied from `brew style` so the check fires without `brew` installed. If that cop changes upstream, update the mirror in `audit.ts` or it will disagree with `brew`.
- **No `head` / `bottle` guidance yet.** The standard covers stable versioned-tarball formulae only; if a KI tool ever ships bottles or a `head` spec, extend the standard and rubric.

[cookbook]: https://docs.brew.sh/Formula-Cookbook
[audit]: https://docs.brew.sh/Manpage#audit-options-formulacask-
[style]: https://docs.brew.sh/Formula-Cookbook#audit-the-formula
[acceptable]: https://docs.brew.sh/Acceptable-Formulae
[taps]: https://docs.brew.sh/Taps
[testbot]: https://docs.brew.sh/Brew-Test-Bot
