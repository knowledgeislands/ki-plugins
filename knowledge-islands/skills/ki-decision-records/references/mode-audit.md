# Mode AUDIT — check Decision Records against the standard

_On-demand procedure for the decision-records AUDIT mode. The format standard, prefix table, naming convention, index rule, and placement rule live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Run the hosted structured checker**: `ki repo audit --skill ki-decision-records --repo <repo>`. The catalogue resolves the decisions directory from `.ki-config.toml`, returns typed outcomes, and exits non-zero through the host when a FAIL remains.
2. **Apply the judgment items** in [the generated rubric](rubric.md): mechanical runs count these as unevaluated rather than manufacturing findings. Read the records to assess substantive sections, value-neutral Context, active-voice Decision, focused length, and semantic prefix fit. A metadata/prefix mismatch needs a human choice; do not let CONFORM select one by overwriting the other.
3. **Report** by `DR · check · fix`, leading with FAIL findings.
