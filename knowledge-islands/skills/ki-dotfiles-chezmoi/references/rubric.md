<!-- GENERATED FILE: produced by `ki skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands chezmoi dotfiles management

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki skill rubric ki-dotfiles-chezmoi --write`.

Line-by-line criteria for auditing ki-dotfiles-chezmoi. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [CHEZMOI — Chezmoi repository shape](#chezmoi--chezmoi-repository-shape)
- [BIN — Bin source naming](#bin--bin-source-naming)
- [GIT — Git hygiene](#git--git-hygiene)
- [PATTERN — App-mutated configuration](#pattern--app-mutated-configuration)
- [CONFIG — Configuration editing](#config--configuration-editing)
- [LAYER — Instruction layering](#layer--instruction-layering)
- [ETIQ — Audit etiquette](#etiq--audit-etiquette)
- [SYNC — Standard synchronisation](#sync--standard-synchronisation)

## CHEZMOI — Chezmoi repository shape

→ [standard](standards-chezmoi-dotfiles.md)

Required repository-shape files and template support.

- **CHEZMOI-1 [M] — Managed ignore file** — A physical `.chezmoiignore` exists at the repository root. (standards-chezmoi-dotfiles.md)
- **CHEZMOI-2 [M] — Template support directory** — When `*.tmpl` files exist, a physical `.chezmoidata/` or `.chezmoitemplates/` also exists. (standards-chezmoi-dotfiles.md)
- **CHEZMOI-J1 [J] — Chezmoiignore negation intent** — A `.chezmoiignore` negation is deliberate and documented rather than accidentally broad. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Are `.chezmoiignore` negations deliberate, documented exceptions to broad ignores?

## BIN — Bin source naming

→ [standard](standards-chezmoi-dotfiles.md)

Chezmoi source-attribute naming for direct bin files.

- **BIN-1 [M] — Bin source-attribute prefix** — Every direct physical file in `bin/` carries a recognised chezmoi source-attribute prefix. (standards-chezmoi-dotfiles.md)

## GIT — Git hygiene

→ [standard](standards-chezmoi-dotfiles.md)

Stray lock files that block Git operations.

- **GIT-1 [M] — Git lock hygiene** — No stray physical `.git/*.lock` files remain in the repository. (standards-chezmoi-dotfiles.md)

## PATTERN — App-mutated configuration

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for Pattern A, Pattern B, and Pattern C selection.

- **PATTERN-J1 [J] — App-mutated config pattern choice** — Pattern A, Pattern B, or Pattern C is chosen correctly for each app-mutated configuration file. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ For each app-mutated configuration file, does the selected pattern match its template ownership, required native lifecycle visibility, and app-owned scope?
- **PATTERN-J2 [J] — Native fragment-binding boundary** — Every Pattern C binding declares its ownership, removal, and adoption boundaries without importing secrets or undeclared application state. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Does every native fragment binding state its canonical source, target, selector, ownership and removal policy, and explicit safe-adoption boundary?

## CONFIG — Configuration editing

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for format-preserving Pattern A and Pattern C editors.

- **CONFIG-J1 [J] — Format-preserving editor selection** — Every Pattern A or Pattern C writer uses an appropriate format-preserving edit API with safe absent-file and invalid-input behaviour. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Do Pattern A and Pattern C writers use a format-appropriate edit API, define absent-file and path behaviour, fail closed, and demonstrate syntax preservation and idempotence?

## LAYER — Instruction layering

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for repository, user, and memory guidance.

- **LAYER-J1 [J] — Agent-instruction layering** — Agent guidance is placed at the correct repository, user, or persistent-memory layer. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Does each piece of agent guidance sit at the correct repository-local, user-level, or persistent-memory layer?

## ETIQ — Audit etiquette

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for reporting before change.

- **ETIQ-J1 [J] — Audit etiquette** — Audits report a file, concise problem, and options before any change is applied. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Were findings reported with a file, concise problem statement, and options before a change was applied?

## SYNC — Standard synchronisation

→ [standard](standards-chezmoi-dotfiles.md)

Judgment criteria for keeping the standard and implementation aligned.

- **SYNC-1 [J] — Standard and rubric synchronisation** — The standard, structured rubric, and mechanical behaviour remain aligned when the standard changes. (standards-chezmoi-dotfiles.md)
  - _Review prompt:_ Do the standard, structured rubric items, and mechanical behaviour still agree?
