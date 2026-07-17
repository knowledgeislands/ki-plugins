# Mode EDUCATE — opt a target in

_On-demand procedure for tokenomics' EDUCATE mode. The config table keys and budget sub-table live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

Scaffold the `[ki-tokenomics]` marker:

1. Run `bun scripts/audit.ts --educate >> .ki-config.toml` in the target.
2. Set the `headroom` expectation (`required` / `recommended` / `off`).
3. Set any `[…budgets]` overrides and optionally `context_window_tokens` (to express headroom as a percentage of the window).
4. Local only; no live change. Confirm the written block looks correct, then run **AUDIT** to establish the baseline.
