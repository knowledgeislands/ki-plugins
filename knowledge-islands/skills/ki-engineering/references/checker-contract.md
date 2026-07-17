# The mechanical-checker contract

ADR: [ADR-KI-HARNESS-SKILLS-002](../../../../docs/decisions/ADR-KI-HARNESS-SKILLS-002-mechanical-judgment-checker-split.md)

A checker is the deterministic half of a standard. It MUST:

- take a target path as its argument and read only that target (`bun scripts/audit-<concern>.ts <path>`);
- emit grouped findings on the **severity ladder** below, each tagged with an area, and a one-line summary tally in the canonical `KEY=n` form — `FAIL=n WARN=n POLISH=n PASS=n ADVISORY=n NA=n`, in ladder order, listing the subset of levels the concern tracks — optionally prefixed by a target count (`N repo(s) · …`) or suffixed by a concern-specific figure (`… · standing surface ~X`). A per-finding checker with no aggregate count (it prints each finding's level inline, e.g. the DR / feature audits) is exempt from the tally line;
- print a **remediation footer** whenever the summary is not clean (any FAIL / WARN / POLISH), naming the skill and mode that addresses it — see [The remediation footer](#the-remediation-footer);
- exit **non-zero iff any FAIL** (every other level exits 0);
- support **`--json`** (emit findings as JSON to stdout instead of the painted table) and **`--report [dir]`** (write the report under the target's `.ki-meta/audits/`, see `enforcement-framework.md` §5) — both are read-only with respect to the audited content;
- depend on **Node/Bun builtins only** — no npm dependencies;
- be **self-contained**: no imports from another skill's files. Skills are symlinked individually into a skills directory, so a cross-skill import would break once deployed. Checkers **compose by being run in sequence**, never by importing one another.

## The severity ladder

One ladder, used by **both** the checker's output and the rubric's findings table. A checker emits the subset of levels its domain warrants — not every concern uses every level.

| Level        | Group     | Blocks? | Meaning                                                                   |
| ------------ | --------- | ------- | ------------------------------------------------------------------------- |
| **FAIL**     | violation | yes     | A required criterion is violated — a ship-stopper.                        |
| **WARN**     | violation | no      | A recommended criterion is violated — should fix, can ship with a reason. |
| **POLISH**   | violation | no      | A minor or cosmetic divergence.                                           |
| **ADVISORY** | deferred  | no      | A judgment criterion the checker cannot decide — handed to the reader.    |
| **INFO**     | context   | no      | Neutral context, not a verdict against a criterion.                       |
| **NA**       | context   | no      | A criterion checked but not applicable to this target.                    |
| **PASS**     | met       | no      | A criterion is met.                                                       |

FAIL / WARN / POLISH replace the rubrics' old `blocker / standard / polish` grades; INFO replaces the ad-hoc `note` level. **ADVISORY vs WARN** is the line to hold: WARN means the checker _decided_ a soft criterion is violated; ADVISORY means it _cannot_ decide and is pointing the reader at a judgment criterion. The summary tallies FAIL / WARN / POLISH / PASS, then ADVISORY / NA; INFO is printed but not tallied.

The checker owns the mechanical criteria; everything it cannot decide deterministically is left to the judgment half, applied by reading — surfaced inline as ADVISORY where the checker can point at the specific criterion.

## The `--json` shape

`--json` is not "emit findings somehow as JSON" — the wrapper and field names are pinned, so a consumer that runs every checker in sequence (e.g. `.ki-meta/bin/aggregate.ts`'s recap) never needs to special-case a given skill's output. The shape is exactly:

```json
{
  "concern": "housekeeping",
  "target": "/path/audited",
  "generatedAt": "2026-07-11T12:00:00.000Z",
  "summary": { "fail": 0, "warn": 1, "polish": 0, "advisory": 2, "info": 0, "na": 0, "pass": 5 },
  "findings": [{ "level": "WARN", "area": "SHAPE-2", "msg": "…", "ref": "references/audit-rubric.md", "file": "skills/foo/SKILL.md" }]
}
```

Rules:

- **One wrapper object, never a bare array.** `findings` is a wrapped property, not the top-level value — a bare array forces every consumer to detect the shape before it can read it.
- **Finding fields are at least `level` / `area` / `msg` (required), plus optional `ref` and `file`** — `level` is the severity-ladder string name (never a numeric enum), `area` MUST be a rubric code drawn from the skill's `references/audit-rubric.md`, `msg` is the message. `ref` is the reference-doc pointer the criterion carries (e.g. `references/markdown-authoring.md`, or `owns:` for an owned-file criterion); `file` is the path a file-scoped finding concerns. Use these field names, not `severity`/`criterion`/`message`, not `check`/`id`. `ref` is populated from the rubric criterion's reference pointer and `area` is the criterion's code, so `references/audit-rubric.md` is the single source for both.
- **`summary` keys are the lowercased ladder names**, present even at zero — a consumer building a totals line should never need to treat a missing key as zero.
- A checker may add extra top-level keys for its own use (e.g. a `source` label); consumers only read the five above.
- **`conform` scripts also support `--json`**, emitting the same wrapper this section pins — so the aggregate renders both verbs identically, each conform action becoming a finding on the shared ladder.

`ki-housekeeping` (bare array, numeric severity), `ki-binding` (`{severity,criterion,message}` field names, no `summary`/`generatedAt`), and `ki-decision-records` / `ki-feature-definitions` (no `--json` support at all) currently deviate — see the ROADMAP for bringing them into conformance.

## The finding line

One row per finding, rendered by the one shared renderer in the aggregate (`.ki-meta/bin/aggregate.ts`, per [ADR-KI-HARNESS-SKILLS-010](../../../../docs/decisions/ADR-KI-HARNESS-SKILLS-010-comparable-cited-checker-findings.md)); a checker's native display follows the same column order (`[area] file msg (ref)`). The layout is:

```text
  <icon> <level, 4-wide> [<area>] <file> <msg> (<ref>)
```

- **Icon** — one per ladder level: ❌ FAIL, ⚠️ WARN, ✨ POLISH, 🧭 ADVISORY, ℹ️ INFO, 🚫 NA, ✅ PASS. Every icon occupies **two display columns**: most are Emoji_Presentation glyphs (natively 2 cols); the narrow-base VS16 glyphs ⚠️/ℹ️ carry an explicit trailing space, because wcwidth-style terminals (VS Code/xterm.js) count them 1 col and VS16 does not widen them.
- **Level** — the short tags `fail` / `warn` / `pol` / `adv` / `info` / `na` / `pass`, padded to a 4-wide field so the `[area]` column aligns.
- **`[area]`**, **`file`** (when the finding carries one, painted cyan) and the trailing dim **`(ref)`** come straight from the finding's structured fields.
- **`msg` restates nothing.** The message MUST NOT restate the finding's `area` or `file` — they render as their own columns, so a restatement prints twice (`[IDX-5] MEMORY.md MEMORY.md: …`). A path may appear in `msg` only when it is _not_ the finding's `file` (or the finding has no `file`). ADVISORY messages carry no `[J]:` prefix — the ADVISORY level _is_ the judgment marker.

## The remediation footer

A checker reports; it does not fix. So when its summary is **not clean** — any FAIL, WARN, or POLISH — it MUST end its human output (not `--json`) with a one-line footer telling the reader how to address what it found: run the owning skill's judgment mode. The fix for a mechanical finding is rarely a matching mechanical edit — deciding _which_ change is right (which layer a fact belongs in, whether an overage is earned, whether a tier fits the work) is the judgment half. The footer routes the reader there instead of leaving them to hand-work the codes.

Shape — after the summary tally, on a non-clean run only:

```text
→ to address: run /<skill> CONFORM   (judgment criteria: references/audit-rubric.md)
```

Rules:

- **Non-clean only.** A clean run (PASS/INFO/NA/ADVISORY, no FAIL/WARN/POLISH) prints no footer — silence means nothing to do.
- **Name the mode, not the fix.** Point at `/<skill> CONFORM` (or the more specific mode the skill defines), never a per-finding how-to — the judgment lives in the mode and the rubric, not duplicated in checker output.
- **Suppressed under `--json`** and `--report`'s machine substrate — the footer is a human affordance; the JSON already carries the findings a composed audit merges.
- **One footer**, after the tally, regardless of how many findings fired.

The footer's presence is **enforced mechanically**: the `ki-skills` linter (SHAPE-8) scans every `audit-*.ts` / `lint-*.ts` source and WARNs if it omits the standardised footer or names another skill's mode — so a new checker cannot ship without one. The linter cannot decide the two behavioural halves — that the footer is _guarded_ on a non-clean run and _suppressed_ under `--json` / `--report` — those stay a judgment read.

## conform: check live state before writing

A `conform.ts` that mutates something outside the repo tree — a GitHub repo setting, a remote API resource, anything not just a local file scaffold — MUST read that state first and compare it to the standard before writing. If it already matches, record **PASS** and skip the write; only write when the target actually drifts. It must never blindly re-issue the same write and re-log **POLISH** on every run regardless of prior state — a write that lands unconditionally isn't reporting drift, it's just re-describing an action it always takes, which makes the output indistinguishable between "this was broken and I fixed it" and "this was already fine." (Local-file scaffolding — an `--educate`-style "create if missing" — is a narrower case of the same rule: check existence/content first, same as above.)

This was missed once already: `ki-repo`'s `conform.ts` unconditionally re-issued every `gh repo edit`/`gh api` write on each run and logged POLISH regardless of live state, until fixed to read `repos/${nwo}` (and the handful of per-setting endpoints) before each write (see git history). Any new or edited `conform.ts` touching live external state should follow the same shape.

## Relationship to [M]/[J] rubric tags

The rubric's `[M]` tag and the checker are two sides of the same coin: every `[M]` criterion must have a corresponding check in the checker; the checker's output severity for that criterion must match the rubric's severity column. `[J]` criteria are outside the checker's scope; the checker may surface them as ADVISORY to guide the reading pass, but must not emit FAIL or WARN for them. See `ki-skills/references/audit-rubric.md` for the tagging rules.
