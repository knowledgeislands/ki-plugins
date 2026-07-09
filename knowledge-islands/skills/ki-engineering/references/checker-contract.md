# The mechanical-checker contract

ADR: [ADR-KI-HARNESS-SKILLS-002](../../../docs/decisions/ADR-KI-HARNESS-SKILLS-002-mechanical-judgment-checker-split.md)

A checker is the deterministic half of a standard. It MUST:

- take a target path as its argument and read only that target (`bun scripts/audit-<concern>.ts <path>`);
- emit grouped findings on the **severity ladder** below, each tagged with an area, and a one-line summary tally;
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
| **SKIP**     | context   | no      | A criterion checked but not applicable to this target.                    |
| **PASS**     | met       | no      | A criterion is met.                                                       |

FAIL / WARN / POLISH replace the rubrics' old `blocker / standard / polish` grades; INFO replaces the ad-hoc `note` level. **ADVISORY vs WARN** is the line to hold: WARN means the checker _decided_ a soft criterion is violated; ADVISORY means it _cannot_ decide and is pointing the reader at a judgment criterion. The summary tallies FAIL / WARN / POLISH / PASS, then ADVISORY / SKIP; INFO is printed but not tallied.

The checker owns the mechanical criteria; everything it cannot decide deterministically is left to the judgment half, applied by reading — surfaced inline as ADVISORY where the checker can point at the specific criterion.

## Relationship to [M]/[J] rubric tags

The rubric's `[M]` tag and the checker are two sides of the same coin: every `[M]` criterion must have a corresponding check in the checker; the checker's output severity for that criterion must match the rubric's severity column. `[J]` criteria are outside the checker's scope; the checker may surface them as ADVISORY to guide the reading pass, but must not emit FAIL or WARN for them. See `ki-skills/references/audit-rubric.md` for the tagging rules.
