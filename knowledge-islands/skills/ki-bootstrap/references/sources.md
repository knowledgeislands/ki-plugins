# Sources — ki-bootstrap

**Refresh:** canonical · on-change

Provenance only: the record of what changed lives in git, not a changelog here. This guidance tracks the delivered Knowledge Islands activation model and refreshes when one of its owners changes.

## In-house

- **[ADR] [ADR-KI-HARNESS-012](../../../../docs/decisions/ADR-KI-HARNESS-012-compatible-harness-publication-and-governed-rubric-boundary.md)** — harness payload, capability, and native-rubric ownership. Last reviewed 2026-07-26.
- **[HC] [Compatible harness contract](../../../../docs/decisions/references/compatible-harness-contract.md)** — harness identity, capability identity, and activation boundary. Last reviewed 2026-07-26.
- **[TK] `tools-ki` command help, implementation, and ADR-KI-TOOLS-002** — public grammar, XDG state, bootstrap, activation, and execution. Last reviewed 2026-07-26.
- **[KR] `ki-repo` skill** — `.ki-config.toml` and declared repository coverage. Last reviewed 2026-07-26.

## Last review

REFRESH last ran **2026-07-26**.

- [ADR] and [HC] confirm that verified installed compatible harnesses are authoritative, runtime links are projections, and repositories never carry an alternative executor.
- [TK] confirms the delivered `ki bootstrap`, `ki harness`, `ki skill user`, `ki skill repo`, `ki repo`, `ki dev`, `ki doctor`, and `ki diag` surfaces used by this skill.
- [KR] confirms that repository coverage remains explicit in `.ki-config.toml` and separate from user activation.

## Open watch-items

- Re-check the core user-skill set whenever bootstrap policy changes.
- Re-check bare-name ambiguity and qualified capability input when multi-harness activation evolves.
- Re-check supported agent discovery and managed link locations when a runtime binding changes.
- Re-check acquisition, replacement, and uninstall wording when harness version selection is introduced.
