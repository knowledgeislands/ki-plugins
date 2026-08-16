<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands chezmoi dotfiles management

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-dotfiles-chezmoi --write`.

Line-by-line criteria for auditing ki-repo-dotfiles-chezmoi. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CHEZMOI — Chezmoi repository shape](#chezmoi--chezmoi-repository-shape)
- [BIN — Bin source naming](#bin--bin-source-naming)
- [GIT — Git hygiene](#git--git-hygiene)
- [PATTERN — App-mutated configuration](#pattern--app-mutated-configuration)
- [CONFIG — Configuration editing](#config--configuration-editing)
- [LAYER — Instruction layering](#layer--instruction-layering)
- [SHELL — Shell paths and completions](#shell--shell-paths-and-completions)
- [ETIQ — Audit etiquette](#etiq--audit-etiquette)
- [SYNC — Standard synchronisation](#sync--standard-synchronisation)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## CHEZMOI — Chezmoi repository shape

→ [standard](standards-chezmoi-dotfiles.md)

Required repository-shape files and template support.

- **CHEZMOI-0 [M] — Repository declaration** — Only a physical `[skills.ki-repo-dotfiles-chezmoi]` declaration selects this optional standard; detected chezmoi shape is coverage evidence for ki-repo. (standards-chezmoi-dotfiles.md)
  - _Remediation:_ diagnostic — Declare the selected standard through the repository configuration owner.
- **CHEZMOI-1 [M] — Managed ignore file** — A physical `.chezmoiignore` exists at the repository root. (standards-chezmoi-dotfiles.md)
  - _Remediation:_ automatic
- **CHEZMOI-2 [M] — Template support directory** — When `*.tmpl` files exist, a physical `.chezmoidata/` or `.chezmoitemplates/` also exists. (standards-chezmoi-dotfiles.md)
  - _Remediation:_ diagnostic — Add the appropriate physical template-support directory after confirming which data or template responsibility the repository needs.
- **CHEZMOI-J1 [J] — Chezmoiignore negation intent** — A `.chezmoiignore` negation is deliberate and documented rather than accidentally broad. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Every `.chezmoiignore` negation and the broad ignore it overrides.
  - _Review prompt:_ Are `.chezmoiignore` negations deliberate, documented exceptions to broad ignores?
  - _Outcomes:_ conforming; documentation required; negation revision required
  - _Conforming guidance:_ Document the intentional exception beside the negation, narrow or remove accidental patterns, and preserve only the intended managed path.

## BIN — Bin source naming

→ [standard](standards-chezmoi-dotfiles.md)

Chezmoi source-attribute naming for direct bin files.

- **BIN-1 [M] — Bin source-attribute prefix** — Every direct physical file in `bin/` carries a recognised chezmoi source-attribute prefix. (standards-chezmoi-dotfiles.md)
  - _Remediation:_ diagnostic — Choose and apply the recognised source-attribute prefix that expresses the file’s intended chezmoi behaviour.

## GIT — Git hygiene

→ [standard](standards-chezmoi-dotfiles.md)

Stray lock files that block Git operations.

- **GIT-1 [M] — Git lock hygiene** — No stray physical `.git/*.lock` files remain in the repository. (standards-chezmoi-dotfiles.md)
  - _Remediation:_ diagnostic — Inspect the lock’s owning process and repository boundary, then use the governed stale-lock recovery procedure; do not remove it blindly.

## PATTERN — App-mutated configuration

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for Pattern A, Pattern B, and Pattern C selection.

- **PATTERN-J1 [J] — App-mutated config pattern choice** — Pattern A, Pattern B, or Pattern C is chosen correctly for each app-mutated configuration file. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Each app-mutated configuration file and its selected Pattern A, B, or C ownership model.
  - _Review prompt:_ For each app-mutated configuration file, does the selected pattern match its template ownership, required native lifecycle visibility, and app-owned scope?
  - _Outcomes:_ conforming; pattern revision required; ownership decision required
  - _Conforming guidance:_ Select the pattern that matches the file’s template ownership, native lifecycle visibility, and app-owned scope, then document the ownership boundary.
- **PATTERN-J2 [J] — Native fragment-binding boundary** — Every Pattern C binding declares its ownership, removal, and adoption boundaries without importing secrets or undeclared application state. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Every Pattern C native fragment binding and its canonical source, target, selector, and lifecycle policy.
  - _Review prompt:_ Does every native fragment binding state its canonical source, target, selector, ownership and removal policy, and explicit safe-adoption boundary?
  - _Outcomes:_ conforming; binding declaration required; adoption boundary revision required
  - _Conforming guidance:_ Declare the canonical source, target, selector, ownership, removal policy, and safe-adoption boundary without importing secrets or undeclared application state.

## CONFIG — Configuration editing

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for format-preserving Pattern A and Pattern C editors.

- **CONFIG-J1 [J] — Format-preserving editor selection** — Every Pattern A or Pattern C writer uses an appropriate format-preserving edit API with safe absent-file and invalid-input behaviour. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Every Pattern A or Pattern C writer and the files it edits.
  - _Review prompt:_ Do Pattern A and Pattern C writers use a format-appropriate edit API, define absent-file and path behaviour, fail closed, and demonstrate syntax preservation and idempotence?
  - _Outcomes:_ conforming; writer revision required; test evidence required
  - _Conforming guidance:_ Use a format-preserving API, define safe absent-file and path behaviour, fail closed, and add evidence for syntax preservation and idempotence.

## LAYER — Instruction layering

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for repository, user, and memory guidance.

- **LAYER-J1 [J] — Agent-instruction layering** — Agent guidance is placed at the correct repository, user, or persistent-memory layer. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Each piece of agent guidance and its repository-local, user-level, or persistent-memory audience.
  - _Review prompt:_ Does each piece of agent guidance sit at the correct repository-local, user-level, or persistent-memory layer?
  - _Outcomes:_ conforming; relocation required; scope decision required
  - _Conforming guidance:_ Move the guidance to the narrowest durable layer that owns its scope, or record the reason a broader layer is required.

## SHELL — Shell paths and completions

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for executable, manual, and completion-path handling.

- **SHELL-J1 [J] — Shell paths and completions** — Shell paths are intentional, idempotent, and optional-tool-safe; tracked completions are regenerated from their owning CLIs. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Every PATH, MANPATH, completion-path entry, optional integration, and tracked completion.
  - _Review prompt:_ Are PATH, MANPATH, and completion search-path entries idempotent and ordered as documented; are optional integrations guarded; and do tracked completions come from repeatable upstream CLI generators?
  - _Outcomes:_ conforming; shell configuration revision required; generator evidence required
  - _Conforming guidance:_ Make paths idempotent and ordered, guard optional integrations, and regenerate tracked completions through their documented upstream CLI generator.

## ETIQ — Audit etiquette

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for reporting before change.

- **ETIQ-J1 [J] — Audit etiquette** — Audits report a file, concise problem, and options before any change is applied. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ Each audit finding and any subsequent proposed or applied change.
  - _Review prompt:_ Were findings reported with a file, concise problem statement, and options before a change was applied?
  - _Outcomes:_ conforming; reporting correction required; change deferral required
  - _Conforming guidance:_ Report the affected file, concise problem, and available options before proposing or applying a change; defer action where that evidence is absent.

## SYNC — Standard synchronisation

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for keeping the standard and implementation aligned.

- **SYNC-1 [J] — Standard and rubric synchronisation** — The standard, structured rubric, and mechanical behaviour remain aligned when the standard changes. (standards-chezmoi-dotfiles.md)
  - _Evidence scope:_ The chezmoi standard, structured rubric items, generated publication, tests, and mechanical behaviour.
  - _Review prompt:_ Do the standard, structured rubric items, and mechanical behaviour still agree?
  - _Outcomes:_ conforming; synchronisation required; standard review required
  - _Conforming guidance:_ Update the affected standard, item, test, and generated publication together, or record the unresolved standard-review question.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
