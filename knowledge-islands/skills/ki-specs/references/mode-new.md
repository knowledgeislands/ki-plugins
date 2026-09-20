# Mode NEW — draft a requirement area

Read the [Specifications standard](standards-specs.md) and [exemplars](exemplars.md) first.

## Adding a requirement

1. Find the registered prefix in `index.md` and allocate the next unused serial, zero-padded to at least three digits.
2. Place the requirement in the feature area's user-observable behaviour or quality-property section.
3. Write `### <PREFIX>-NNN — <short title>` and one normative BCP-14 statement without rationale.
4. If a recorded decision governs it, cite the Decision Record inline.
5. Add `_Conformance:_ conforming | pending | divergent` truthfully.
6. Add a concrete `_Verify:_` plan. When conforming, add `_Evidence:_` naming current proof.
7. Run `ki repo audit --skill ki-specs`.

## Adding a new area

1. Choose a unique uppercase prefix.
2. Create `docs/specs/<feature-area>.md` with `# <Title> — <PREFIX>`, a scope paragraph linking to `index.md`, classification sections, and optional Gaps.
3. Register its file, prefix, and coverage in the index areas table.
4. Seed only accepted requirements; keep unaccepted candidates in Gaps.
5. Run the checker.

## Promoting a Gap

Promote a Gap when it becomes accepted, not only when implementation lands. Allocate the next ID, write the contract, declare current conformance, add its verification plan, and remove the bullet.
