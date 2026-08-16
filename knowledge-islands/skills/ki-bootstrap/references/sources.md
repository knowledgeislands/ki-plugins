# Sources — ki-bootstrap

**Refresh:** canonical · on-change

Provenance only: the record of what changed lives in git, not a changelog here. This guidance tracks the delivered Knowledge Islands activation model and refreshes when one of its owners changes.

## In-house

- **[ADR] [ADR-KI-HARNESS-012](../../../../docs/decisions/ADR-KI-HARNESS-012-compatible-harness-publication-and-governed-rubric-boundary.md)** — harness payload, capability, and native-rubric ownership. Last reviewed 2026-08-12.
- **[HC] [Compatible harness contract](../../../../docs/decisions/references/compatible-harness-contract.md)** — harness identity, capability identity, and activation boundary. Last reviewed 2026-08-12.
- **[TK] installed `ki --help` surfaces** — current public grammar, bootstrap, activation, local development, and diagnostics. Last reviewed 2026-08-12.
- **[KR] `ki-repo` skill** — `.ki-config.toml` and declared repository coverage. Last reviewed 2026-08-12.

## Last review

REFRESH last ran **2026-08-12**.

- [ADR] and [HC] confirm that verified installed compatible harnesses are authoritative, runtime links are projections, and repositories never carry an alternative executor.
- [TK] confirms current `ki bootstrap`, `ki harness`, `ki skill add/remove`, `ki repo skill add/remove`, `ki repo`, `ki dev local set/on/off`, and `ki manage doctor/diag` grammar.
- [KR] confirms that repository coverage remains explicit in `.ki-config.toml` and separate from user activation.
- The FND-003 boundary review confirmed that this skill remains guidance-only: no harness-local bootstrap process launch, publisher, synchroniser, generated HELP, or repository executor remains. `tools-ki` owns bootstrap execution, native rubric hosting, reporting, and transactions; its validated external `ConformCommand` and per-agent user-space mutation boundaries remain deliberately external.

## Open watch-items

- Re-check the core user-skill set whenever bootstrap policy changes.
- Re-check bare-name ambiguity and qualified capability input when multi-harness activation evolves.
- Re-check supported agent discovery and managed link locations when a runtime binding changes.
- Re-check acquisition, replacement, and uninstall wording when harness version selection is introduced.
