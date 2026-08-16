<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — interactive React/Vite website

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-website-app --write`.

Line-by-line criteria for auditing ki-repo-website-app. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [APP — Interactive website](#app--interactive-website)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## APP — Interactive website

→ [standard](standards-app-site.md)

React/Vite client application implementation.

- **APP-1 [M] — React runtime** — React and React DOM are declared dependencies. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-2 [M] — Vite toolchain** — Vite and its official React plugin are declared. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-3 [M] — Single build system** — The app implementation does not also carry Eleventy. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-4 [M] — Vite configuration** — A Vite config is present at the site root. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-5 [M] — Application entry** — index.html and a React main module are present. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-6 [M] — App build command** — ki:site:build runs vite build. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-7 [M] — App development command** — ki:site:dev runs Vite. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-8 [M] — Dist output** — Vite emits the shared dist seam. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-9 [M] — App opt-in** — The app implementation table is present. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
- **APP-10 [M] — App opt-in validation** — The app marker table is keyless. (standards-app-site.md)
  - _Remediation:_ diagnostic — Align the interactive app with the React/Vite implementation or select the content implementation instead.
