# Mode AUDIT — assess a KI–Paperclip coordination arrangement

_On-demand procedure for the coordination AUDIT mode. The position, shared model, and mode set live in [`SKILL.md`](../SKILL.md) and are already loaded; the normative claims live in the [coordination standard](standards-agent-coordination-paperclip.md). This file is the procedure only._

1. **Confirm the declaration.** This skill is `ki-applicability: declaration-only`: no repository shape implies it. A repository opts in with its owning company code in `.ki.toml`, placed in the governance section:

   ```toml
   [skills.ki-agent-coordination-paperclip]
   organisation_code = "KIS"
   ```

   Without it the host exits 2 with `--skill must name one declared resolved skill`. That message means the repository has not declared the capability; it is not an environment fault. Confirm with `grep -n 'ki-agent-coordination-paperclip' <repo>/.ki.toml` before treating the arrangement as ungoverned.

2. **Pin the host environment when auditing from inside a Paperclip run.** A Paperclip run scopes `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, and `XDG_STATE_HOME` to the run directory, where no KI state exists. The user KI environment is reached through `PAPERCLIP_GITHUB_HOST_HOME`, which every Paperclip run injects, so this hardcodes no path:

   ```bash
   env -u XDG_CONFIG_HOME -u XDG_DATA_HOME -u XDG_STATE_HOME \
       HOME="$PAPERCLIP_GITHUB_HOST_HOME" \
       ki repo audit --skill ki-agent-coordination-paperclip --repo <repo>
   ```

   Unpinned, the host reports `declared skill <name> is provided by no declared harness` because no harness is installed under the run-scoped home. Unset all three: the repository registry lives under `XDG_STATE_HOME`, and leaving it pinned to the run directory produces a spurious `REPO-REG-1` failure on every repository. Outside a Paperclip run, invoke `ki` directly.

3. **Read the mechanical result as resolution evidence, not conformance evidence.** The catalogue registers no mechanical audit operation: every COORD item is a judgment criterion. A conforming host run reports `1 skill selected` and `PASS` with no findings, which proves only that the declaration resolves against an installed harness. Never report that `PASS` as evidence that the arrangement conforms.

4. **Apply the judgment items** in [the generated rubric](rubric.md) against the arrangement's own evidence: the Paperclip company, agent roles, tasks, execution workspaces, and the KI repositories and admitted revisions those tasks name. Mechanical runs count these as unevaluated rather than manufacturing findings.

5. **Report repository facts separately from remote Paperclip facts.** Name the repository and admitted revision for each repository claim, and the task or agent identifier for each Paperclip claim. An unavailable remote view is unknown, not a pass — record it as unavailable and say what would resolve it.
