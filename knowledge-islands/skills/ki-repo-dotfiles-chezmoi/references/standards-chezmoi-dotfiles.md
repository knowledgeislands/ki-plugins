# Chezmoi dotfiles-management standard

The rationale behind [the generated rubric](rubric.md) and its structured catalogue. Grounded in chezmoi's own documented behavior plus one anonymized real-repo case study — see [sources](sources.md) for provenance and the honesty note on what's tool behavior versus house convention.

## Contents

- [Repo layout & naming](#repo-layout--naming)
- [Edit discipline](#edit-discipline)
- [Shell configuration: loader, not rc](#shell-configuration-loader-not-rc)
  - [Paths and completions](#paths-and-completions)
- [bin/ dispatcher pattern](#bin-dispatcher-pattern)
- [App-mutated config handling](#app-mutated-config-handling)
  - [Native fragment-binding contract](#native-fragment-binding-contract)
  - [Selecting a surgical config editor](#selecting-a-surgical-config-editor)
- [Single-source, multi-target config templating](#single-source-multi-target-config-templating)
- [Agent-instruction layering](#agent-instruction-layering)
- [OS/tooling gotchas](#ostooling-gotchas)
- [Git boundary](#git-boundary)
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

**`.chezmoiignore` negation-through-ignored-parents**: unlike strict `.gitignore` semantics, a `!`-negation line in `.chezmoiignore` matches through a broadly ignored parent directory without needing an intermediate un-ignore of that parent — `dir/*/*` then `!dir/*/specific-file` un-ignores `specific-file` under any immediate child of `dir/`, with no `!dir/*/` line needed in between.

## Edit discipline

**Edit the source, never the rendered target.** A hand-edit to a file under `$HOME` is silently clobbered by the next `chezmoi apply` — there is no warning, the source of truth always wins. Resolve between the two with `chezmoi source-path <target>` (find the source file behind a `$HOME` path) and `chezmoi target-path <source>` (find where a source file renders to).

**Managed target retirement.** When a managed source is renamed or deleted, append its old home-relative target path to `.chezmoiremove` so every managed machine receives the removal on its next apply. Treat this file as an append-only migration ledger: append a dated, concise reason at the end, retain the block until every managed machine has applied it, and prune only through a deliberate housekeeping pass. Do not treat a successful apply on one machine as evidence that a shared removal record is safe to discard.

**A successful apply is not a loaded config.** `chezmoi apply` writes a target by replacing it, not by editing it in place — the target's inode changes, measured directly on chezmoi v2.72.0. An application that watches its config file for changes may be watching the old inode, so it can keep running on the pre-apply configuration indefinitely with no error anywhere: chezmoi reports success, `chezmoi diff` is empty, and the file on disk is correct. This is most visible in long-running GUI applications that hot-reload their own config. When an apply appears to have had no effect, check the target's content before re-diagnosing the source, then force the application to re-read it — open its config file in the application and save it (a real write on the current inode, which the watcher will see), or restart the application. Note also that settings which govern the state a UI element is _created_ in will not retroactively change elements already on screen.

## Shell configuration: loader, not rc

Shell rc files (`.zshrc`, `.bashrc`, etc.) should be thin loops that `source` every file under one or more shared config directories, rather than accumulating configuration inline:

```sh
for f in ~/.allsh/* ~/.shellname/*; do source "$f"; done
```

New configuration becomes a new file dropped into the right directory — never an append to the rc itself. A numeric load-order prefix on each file's name (e.g. `00_` earliest — PATH/completion setup, `50_` mid — tool activation, `90_` late — per-tool completions/aliases, `99_` last — prompt) makes load order explicit and greppable; pick a prefix matching when the snippet needs to run, and name the rest of the filename after what it does.

### Paths and completions

Treat `PATH`, `MANPATH`, and shell completion search paths as ordered, user-visible interfaces rather than incidental environment variables. Make every contribution idempotent, document the repository's intended precedence, and guard optional tools and package managers so a fresh machine or an uninstalled integration still starts a shell successfully. Keep manual-page precedence compatible with executable precedence wherever a tool supplies its own manuals.

Generate a tracked CLI completion from that CLI's supported completion command, such as `<tool> completion <shell>`, instead of maintaining a hand-written copy. Keep the generator in the source tree, make regeneration repeatable, and condition both generation and shell loading on the required tool or completion file being available. Exact tool choices and precedence belong in the consuming repository's local guidance, not in this standard.

## bin/ dispatcher pattern

A single bootstrap entrypoint accepts an action (`install | update | cleanup | backup`) plus an optional list of subsystem names, loops over the requested (or default) subsystems, and calls each subsystem's own script with that action. Each subsystem script is a **no-op for actions that don't apply to it** — the dispatcher never needs to know which subsystems care about which actions. This is a registry-of-independent-installers shape: adding a new subsystem means adding one new script and one line in the dispatcher's subsystem list, never touching the dispatch logic itself.

## App-mutated config handling

Some config files are partly hand-authored, partly rewritten by the application itself at runtime (a JSON preferences file an app resaves on every launch, for example). Three named patterns handle this, chosen by an ownership decision rather than by tool convenience.

**Decision rule** — use **Pattern B** when source-owned template expressions must govern part of an otherwise application-mutated file. Otherwise, use **Pattern C** when the durable desired state is a narrow set of records that must participate in native chezmoi `status`, `diff`, and `apply`. Use **Pattern A** when the application file is predominantly app-owned and a post-apply reconciliation trigger is sufficient. The rough ≥90%-app-owned threshold is a useful warning that whole-file ownership is probably wrong; it does not decide between the two narrow patterns.

- **Pattern A — surgical patch.** Leave the live file _out_ of chezmoi's managed set entirely (list it in `.chezmoiignore`). Instead, patch only the specific user-owned keys after the app has written its own state, via a `run_onchange_after_<name>.sh.tmpl` script — chezmoi re-runs a `run_onchange_` script only when its own rendered content (including any resolved secrets) changes, giving a natural "re-patch when the desired state changes" trigger. Select a format-preserving editor as described below; a value-model query tool that rewrites the whole document is not a surgical editor. Confirm separately that the application retains the patched keys after later writes, or add an appropriate reconciliation trigger.
- **Pattern B — full template + reverse-merge.** Manage the entire file as a `.tmpl` end-to-end. Because the app still mutates parts of it at runtime, a companion merge script pulls the live file's current (app-mutated) state back into the source template _before_ `chezmoi diff`/`chezmoi apply` runs — the template's `{{ }}`-interpolated subtrees are the source of truth ("tainted", never overwritten by the merge), while everything else flows live → source on each merge. The workflow is **merge → diff → apply**, in that order, every time.
- **Pattern C — native fragment binding.** Manage a narrow transformation as a chezmoi `modify_` source. It reads the live target from standard input and returns the desired target state, so chezmoi itself exposes pending changes through `status`, `diff`, and `apply`. The binding owns only declared fragments; it does not turn the application file into a whole-file template or import the live file as source.

**Discovering an undocumented config surface.** Choosing a pattern needs the file's real key set, and an application that mutates its own config often documents only a fraction of it. When the vendor documentation is thin, read the surface out of the shipped executable rather than guessing from the live file, which only shows keys the user or app happens to have set: `rg -a` over the binary recovers embedded setting names, their help text, and the defaults block, and `nm -a` recovers enough module and type structure to judge which code paths consume a setting. Treat what this yields as evidence about one build — record the version alongside any claim, and prefer a key confirmed by both a default value and a doc string over one seen only as a bare string. This locates the surface; it does not establish ownership, so the decision rule above still applies.

Switching a file between patterns requires an explicit source and target migration. Do not leave a whole-file template, reverse merge, post-apply patch, and `modify_` binding competing for the same target.

### Native fragment-binding contract

A Pattern C binding declares its canonical source, target, format-aware selector, applicability filter when multiple clients share the data, ownership policy, removal behaviour, and whether live state may be adopted.

`merge` is the default ownership policy: add or update declared records and preserve undeclared application-owned state. Removing a canonical record does not silently revoke a live record under `merge`; revocation must be an explicit declared replacement policy or a deliberate live edit. Use replacement only for an identified authoritative collection and state its boundary exactly.

Adoption is separate from `chezmoi re-add`: it selects one declared binding, previews a source diff by default, and writes only after explicit confirmation. Bindings containing credentials, secret references, or template expressions are not adoptable from a live target. Keep binding metadata and canonical data internal unless a rendered copy is itself useful user-facing configuration.

The transformer defines absent-file, malformed-input, and unsupported-syntax behaviour before it writes. It parses before and after editing, fails without truncating the input, and preserves undeclared content and concrete syntax to the degree the selected editor supports. A source script may itself be templated to receive canonical data; that does not make the application target a `.tmpl` file.

### Selecting a surgical config editor

A Pattern A or Pattern C write is surgical only when it changes the intended values while preserving unrelated concrete syntax as far as the format and editor support: comments, key order, quoting, indentation, line endings, and final-newline state should not churn merely because the file was parsed and written. Minimal textual churn, not semantic equivalence alone, is the selection criterion.

Separate inspection from mutation. Value-model tools are useful for querying or validating data, and they may be used to write when whole-document canonicalization is an explicit requirement. Do not use one for a surgical write unless its documented edit API and representative fixtures demonstrate the required preservation.

Use these house defaults as starting points:

- **TOML** — `tomlkit`, which exposes a style-preserving document model for Python.
- **YAML** — `ruamel.yaml`'s round-trip API. Exercise the actual constructs present, especially anchors, tags, block scalars, and comments; round-trip support is not a promise that every input is byte-identical.
- **JSON / JSONC** — `jsonc-parser`'s edit API, which computes localized edits while retaining comments and existing formatting around untouched content. Plain JSON is a valid subset of this workflow.
- **JSONL** — parse and replace only the intended records; copy every unchanged line verbatim rather than serializing the complete file.
- **JSON5 and other unsupported formats** — there is no house default. Stop and prove a narrow editor against representative fixtures, or choose a pattern that explicitly owns the whole document; never silently fall back to whole-file reserialization.

Python editors may run in an on-demand isolated environment via `uv run --with <package> python <script>`; add `--no-project` when the patch must not inherit the current project's dependencies. That is dependency execution, not a preservation guarantee: pin a compatible version when reproducibility matters, and account for dependency availability when the patch must work offline.

Every Pattern A or Pattern C writer defines what happens when the file, parent object, or target key is absent; parses before and after the edit; fails without truncating the original on invalid input; and has representative fixtures proving that the intended value changes, unrelated syntax remains stable, and a second identical run produces no diff. Pattern C evidence also proves that its declared fragments are the only changed ownership boundary. Include the format features actually present in the live file rather than relying on a toy fixture. Filesystem replacement, symlink, permissions, ownership, secret-redaction, and concurrent-app-write policy remain part of the implementation's safety review even when the editor itself is format-preserving.

## Single-source, multi-target config templating

When several distinct targets (client apps, environments, hosts) each need their own rendering of essentially the same list of items, keep **one** structured data file (e.g. a `.chezmoidata/*.yaml`) as the single source of truth, and a **shared** Go-template partial (under `.chezmoitemplates/`) that renders each item into its per-target fragment, filtered by which item applies to which target (e.g. a `targets:` field on each entry). This is a general "N-item source → M rendered targets via one shared partial" shape — invoke the same partial from every place a target's config gets assembled, including a Pattern A script, Pattern B template, or Pattern C `modify_` source, so the rendering logic never forks between call sites.

## Agent-instruction layering

Two layers, and the decision rule for which one a piece of guidance belongs in:

- **Layer 1 — repository-local.** A thin root index file that imports one topic file per concern. Extend it by appending to an existing topic file, or by adding a new topic file plus one import line — never by growing the root index itself.
- **Layer 2 — user-level.** A `private_`-prefixed, `dot_`-targeted file that chezmoi renders to the selected runtime's global agent-config location, applying across every repository and session on that machine, and syncing via the normal `chezmoi update`/`apply` flow.

**Decision rule**: repository-specific guidance → Layer 1. A personal preference that holds across every project → Layer 2. A fact about the user themselves (their role, their working style) → a persistent-memory mechanism, not either instruction layer.

This is a _repository-local-vs-user-level_ split — a different axis from the runtime-neutral-vs-runtime-binding split owned by `ki-repo`. A chezmoi repository commonly uses both: this skill decides where guidance lives, while `ki-repo` decides which file carries runtime-neutral orientation within Layer 1.

## OS/tooling gotchas

- **macOS case-insensitive filesystems.** APFS and HFS+ are case-insensitive by default: two paths differing only in letter case resolve to the _same inode_. Before treating two differently-cased "files" (often left behind by a rename that only changed case) as distinct, verify with `stat -f "%i" path1 path2` — matching inode numbers mean it's one file under two names, and deleting one deletes both.
- **macOS `sed` and non-ASCII characters.** Set `export LC_ALL=C` before running `sed` on text that may contain box-drawing or other non-ASCII characters (`├`, `└`, `│`) — macOS's `sed` raises `illegal byte sequence` without it.

## Git boundary

`ki-git` owns portable Git and commit policy, including safe lock recovery.

This standard owns only chezmoi's runtime-specific registration of a selected compatible hook payload; it does not define Git hygiene or remove locks.

Its existing local physical-lock observation is scoped evidence for a chezmoi repository, not an independent portable Git policy.

## Repo-shape expectations (additive to generic repo-standard checks)

This is _additive_ to a generic repo standard's file-presence checks (README/LICENSE/.gitignore etc.), not a restatement of them:

- `.chezmoiignore` is expected to exist as a physical regular file in any chezmoi source repository. CONFORM may create it only when the path is absent; it never replaces an existing file or unsafe path.
- `.chezmoidata/` and/or `.chezmoitemplates/` are expected to exist as physical directories whenever the tree contains any physical `.tmpl` files.
