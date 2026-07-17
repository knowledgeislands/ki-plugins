# The chezmoi dotfiles-management standard

The rationale behind [the audit rubric](audit-rubric.md) and [`../scripts/audit.ts`](../scripts/audit.ts). Grounded in chezmoi's own documented behavior plus one anonymized real-repo case study — see [sources](sources.md) for provenance and the honesty note on what's tool-behavior versus house convention.

## Contents

- [Repo layout & naming](#repo-layout--naming)
- [Edit discipline](#edit-discipline)
- [Shell configuration: loader, not rc](#shell-configuration-loader-not-rc)
- [bin/ dispatcher pattern](#bin-dispatcher-pattern)
- [App-mutated config handling](#app-mutated-config-handling)
  - [Selecting a surgical config editor](#selecting-a-surgical-config-editor)
- [Single-source, multi-target config templating](#single-source-multi-target-config-templating)
- [CLAUDE.md / agent-instruction layering](#claudemd--agent-instruction-layering)
- [OS/tooling gotchas](#ostooling-gotchas)
- [Git & audit hygiene](#git--audit-hygiene)
- [Repo-shape expectations](#repo-shape-expectations-additive-to-generic-repo-standard-checks)

## Repo layout & naming

chezmoi maps source-tree names to `$HOME` targets through stacking prefixes:

| Source prefix       | Target effect                                  |
| ------------------- | ---------------------------------------------- |
| `dot_<name>`        | `~/.<name>` (file or directory)                |
| `executable_<name>` | executable bit set on the rendered target      |
| `private_<name>`    | target mode `0600`                             |
| `<name>.tmpl`       | rendered as a Go template before being written |

Prefixes stack in source-name order, e.g. `executable_dot_bash/private_secrets.tmpl` renders to an executable, mode-600, templated file under `~/.bash/`. A leading double-underscore (`executable__foo`) is a legitimate trick to force early lexical sort order among sibling scripts — not a typo.

`bin/` **executable convention**: scripts named `executable_<name>` under a `bin/` source directory land on `$PATH` as `~/bin/<name>`. Other chezmoi source-attribute prefixes (`symlink_`, `private_`, `dot_`, etc.) are equally legitimate for a file living under `bin/` — the convention is "every file carries _a_ recognized chezmoi attribute prefix," not "every file is specifically `executable_`."

**`chezmoi doctor/status/managed/unmanaged`** is the standard health-check workflow: `doctor` runs chezmoi's own built-in diagnostics, `status` shows pending apply drift, `managed`/`unmanaged` diff the source tree against `$HOME` to catch files that should (or shouldn't) be tracked — run this periodically, not just once at repo setup.

**`.chezmoiignore` negation-through-ignored-parents**: unlike strict `.gitignore` semantics, a `!`-negation line in `.chezmoiignore` matches through a broadly-ignored parent directory without needing an intermediate un-ignore of that parent — `dir/*/*` then `!dir/*/specific-file` un-ignores `specific-file` under any immediate child of `dir/`, with no `!dir/*/` line needed in between.

## Edit discipline

**Edit the source, never the rendered target.** A hand-edit to a file under `$HOME` is silently clobbered by the next `chezmoi apply` — there is no warning, the source of truth always wins. Resolve between the two with `chezmoi source-path <target>` (find the source file behind a `$HOME` path) and `chezmoi target-path <source>` (find where a source file renders to).

## Shell configuration: loader, not rc

Shell rc files (`.zshrc`, `.bashrc`, etc.) should be thin loops that `source` every file under one or more shared config directories, rather than accumulating configuration inline:

```sh
for f in ~/.allsh/* ~/.shellname/*; do source "$f"; done
```

New configuration becomes a new file dropped into the right directory — never an append to the rc itself. A numeric load-order prefix on each file's name (e.g. `00_` earliest — PATH/completion setup, `50_` mid — tool activation, `90_` late — per-tool completions/aliases, `99_` last — prompt) makes load order explicit and greppable; pick a prefix matching when the snippet needs to run, and name the rest of the filename after what it does.

## bin/ dispatcher pattern

A single bootstrap entrypoint accepts an action (`install | update | cleanup | backup`) plus an optional list of subsystem names, loops over the requested (or default) subsystems, and calls each subsystem's own script with that action. Each subsystem script is a **no-op for actions that don't apply to it** — the dispatcher never needs to know which subsystems care about which actions. This is a registry-of-independent-installers shape: adding a new subsystem means adding one new script and one line in the dispatcher's subsystem list, never touching the dispatch logic itself.

## App-mutated config handling

Some config files are partly hand-authored, partly rewritten by the application itself at runtime (a JSON preferences file an app resaves on every launch, for example). Two named patterns handle this, chosen by a decision rule:

**Decision rule** — inventory the file's top-level keys. If roughly 90% or more are app-owned (the app rewrites them and a human essentially never touches them directly), use **Pattern A**. Otherwise, use **Pattern B**.

- **Pattern A — surgical patch.** Leave the live file _out_ of chezmoi's managed set entirely (list it in `.chezmoiignore`). Instead, patch only the specific user-owned keys after the app has written its own state, via a `run_onchange_after_<name>.sh.tmpl` script — chezmoi re-runs a `run_onchange_` script only when its own rendered content (including any resolved secrets) changes, giving a natural "re-patch when the desired state changes" trigger. Select a format-preserving editor as described below; a value-model query tool that rewrites the whole document is not a surgical editor. Confirm separately that the application retains the patched keys after later writes, or add an appropriate reconciliation trigger.
- **Pattern B — full template + reverse-merge.** Manage the entire file as a `.tmpl` end-to-end. Because the app still mutates parts of it at runtime, a companion merge script pulls the live file's current (app-mutated) state back into the source template _before_ `chezmoi diff`/`chezmoi apply` runs — the template's `{{ }}`-interpolated subtrees are the source of truth ("tainted", never overwritten by the merge), while everything else flows live → source on each merge. The workflow is **merge → diff → apply**, in that order, every time.

Switching a file from one pattern to the other requires explicitly deleting/adding the `.tmpl` + merge script (Pattern B) or the `.chezmoiignore` entry + patch script (Pattern A) accordingly — the two are not simultaneously valid for the same file.

### Selecting a surgical config editor

A Pattern A write is surgical only when it changes the intended values while preserving unrelated concrete syntax as far as the format and editor support: comments, key order, quoting, indentation, line endings, and final-newline state should not churn merely because the file was parsed and written. Minimal textual churn, not semantic equivalence alone, is the selection criterion.

Separate inspection from mutation. Value-model tools are useful for querying or validating data, and they may be used to write when whole-document canonicalization is an explicit requirement. Do not use one for a surgical write unless its documented edit API and representative fixtures demonstrate the required preservation.

Use these house defaults as starting points:

- **TOML** — `tomlkit`, which exposes a style-preserving document model for Python.
- **YAML** — `ruamel.yaml`'s round-trip API. Exercise the actual constructs present, especially anchors, tags, block scalars, and comments; round-trip support is not a promise that every input is byte-identical.
- **JSON / JSONC** — `jsonc-parser`'s edit API, which computes localized edits while retaining comments and existing formatting around untouched content. Plain JSON is a valid subset of this workflow.
- **JSONL** — parse and replace only the intended records; copy every unchanged line verbatim rather than serializing the complete file.
- **JSON5 and other unsupported formats** — there is no house default. Stop and prove a narrow editor against representative fixtures, or choose a pattern that explicitly owns the whole document; never silently fall back to whole-file reserialization.

Python editors may run in an on-demand isolated environment via `uv run --with <package> python <script>`; add `--no-project` when the patch must not inherit the current project's dependencies. That is dependency execution, not a preservation guarantee: pin a compatible version when reproducibility matters, and account for dependency availability when the patch must work offline.

Every surgical writer defines what happens when the file, parent object, or target key is absent; parses before and after the edit; fails without truncating the original on invalid input; and has representative fixtures proving that the intended value changes, unrelated syntax remains stable, and a second identical run produces no diff. Include the format features actually present in the live file rather than relying on a toy fixture. Filesystem replacement, symlink, permissions, ownership, secret-redaction, and concurrent-app-write policy remain part of the implementation's safety review even when the editor itself is format-preserving.

## Single-source, multi-target config templating

When several distinct targets (client apps, environments, hosts) each need their own rendering of essentially the same list of items, keep **one** structured data file (e.g. a `.chezmoidata/*.yaml`) as the single source of truth, and a **shared** Go-template partial (under `.chezmoitemplates/`) that renders each item into its per-target fragment, filtered by which item applies to which target (e.g. a `targets:` field on each entry). This is a general "N-item source → M rendered targets via one shared partial" shape — invoke the same partial from every place a target's config gets assembled (whether that's a `run_onchange_` heredoc under Pattern A or an inline `.tmpl` include under Pattern B) so the rendering logic never forks between call sites.

## CLAUDE.md / agent-instruction layering

Two layers, and the decision rule for which one a piece of guidance belongs in:

- **Layer 1 — repo-local.** A thin root index file (`CLAUDE.md`) that imports one topic file per concern. Extend it by appending to an existing topic file, or by adding a new topic file plus one import line — never by growing the root index itself.
- **Layer 2 — user-level.** A `private_`-prefixed, `dot_`-targeted file that chezmoi renders to the user's global agent-config location, applying across every repo and session on that machine, and syncing via the normal `chezmoi update`/`apply` flow.

**Decision rule**: repo-specific guidance → Layer 1. A personal preference that holds across every project → Layer 2. A fact about the user themselves (their role, their working style) → a persistent-memory mechanism, not either CLAUDE.md layer — CLAUDE.md is instructions, memory is facts.

This is a _repo-local-vs-user-level_ split — a different axis from `ki-repo`'s runtime-neutral-vs-Claude-specific split (a literal root `AGENTS.md` plus a thin `CLAUDE.md` that imports it, for repos targeting a non-Claude-Code runtime; see [its standard](../../../keystone/ki-repo/references/repo-standard.md#layer-1--repo-files)). A chezmoi repo commonly runs both at once: this skill's Layer 1/Layer 2 for _where_ a piece of guidance lives, `ki-repo`'s split for _which file_ carries the runtime-neutral orientation within Layer 1.

## OS/tooling gotchas

- **macOS case-insensitive filesystems.** APFS and HFS+ are case-insensitive by default: two paths differing only in letter case resolve to the _same inode_. Before treating two differently-cased "files" (often left behind by a rename that only changed case) as distinct, verify with `stat -f "%i" path1 path2` — matching inode numbers mean it's one file under two names, and deleting one deletes both.
- **macOS `sed` and non-ASCII characters.** Set `export LC_ALL=C` before running `sed` on text that may contain box-drawing or other non-ASCII characters (`├`, `└`, `│`) — macOS's `sed` raises `illegal byte sequence` without it.

## Git & audit hygiene

- Don't leave stray git lock files (`.git/index.lock`, `.git/HEAD.lock`, `.git/config.lock`, `.git/refs/**/*.lock`, `.git/packed-refs.lock`) behind — they block all subsequent git operations until manually removed. Don't kill git commands mid-flight; don't run multiple write-mode git commands in parallel (read-only commands — `status`, `log`, `diff`, `show`, `rev-parse` — are safe to parallelize). Verify with `find .git -name '*.lock'` before finishing a session of git activity.
- **Audit via skills, not hand-rolled shell.** Prefer a dedicated audit skill/script over retyping the same shell loop each time — it's cheaper and less error-prone than re-deriving the check from scratch every session.
- **Report-then-confirm etiquette.** When auditing, link to the file, state the problem in one line, present options rather than silently applying a single fix, and wait for confirmation before changing anything.

## Repo-shape expectations (additive to generic repo-standard checks)

This is _additive_ to a generic repo standard's file-presence checks (README/LICENSE/.gitignore etc.), not a restatement of them:

- `.chezmoiignore` is expected to exist in any chezmoi source repo.
- `.chezmoidata/` and/or `.chezmoitemplates/` are expected to exist whenever the tree contains any `.tmpl` files — a repo using Go templating without either directory is a sign templating is being done ad hoc rather than through the shared-data/shared-partial shape above.
