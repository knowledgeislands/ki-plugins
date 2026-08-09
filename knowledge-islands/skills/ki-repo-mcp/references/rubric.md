<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — Knowledge Islands MCP servers

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-mcp --write`.

Line-by-line criteria for auditing ki-repo-mcp. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [KI — Applicability and declaration](#ki--applicability-and-declaration)
- [LAY — Source layout](#lay--source-layout)
- [DOC — MCP documentation](#doc--mcp-documentation)
- [CFG — Configuration](#cfg--configuration)
- [UTIL — Shared utilities](#util--shared-utilities)
- [TEST — Test wiring](#test--test-wiring)
- [TOOL — Tool surface](#tool--tool-surface)
- [PKG — Package entry points](#pkg--package-entry-points)
- [SCR — MCP scripts](#scr--mcp-scripts)
- [CI — Smoke CI](#ci--smoke-ci)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## KI — Applicability and declaration

→ [standard](standards-mcp-servers.md#applicability)

Scope activation and the keyless ki-repo-mcp governance declaration.

- **KI-CONFIG [M] — MCP applicability and declaration** — A repository is applicable when it declares [skills.ki-repo-mcp] or contains src/mcp-server/. Otherwise the audit emits one NOT_APPLICABLE finding and stops; declared keys are rejected because this skill has no configuration options. (standards-mcp-servers.md#applicability)
  - _Remediation:_ automatic

## LAY — Source layout

→ [standard](standards-mcp-servers.md#1-project-layout)

The repository separates MCP wiring, tool shells, reusable implementation, configuration, and shared utilities.

- **LAY-1 [M + J] — MCP source layout** — src/ contains config/, mcp-server/, tools/, main/, and utils/; an optional cli/ contains cli.ts and index.ts. (standards-mcp-servers.md#1-project-layout)
  - _Remediation:_ diagnostic — Restore the required source layout without moving implementation across ownership boundaries automatically.
  - _Evidence scope:_ MCP tool shells, main implementation, utilities, and optional CLI layers.
  - _Review prompt:_ Review tools/ for thin validation-and-envelope shells, main/ for concern-grouped implementation, no console output in main/utils, and cli/ as a shared-main human shell rather than a second implementation.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Refactor only through the owning architecture decision, or record a named gap or explicit exclusion.

## DOC — MCP documentation

→ [standard](standards-mcp-servers.md#11-docs)

MCP-specific root documentation exists and remains substantive.

- **DOC-1 [M + J] — MCP root documents** — ROADMAP.md is present; CONTRIBUTING.md and SECURITY.md are present; CHANGELOG.md is present and non-empty. (standards-mcp-servers.md#11-docs)
  - _Remediation:_ diagnostic — Add or repair the required root documentation using current repository evidence.
  - _Evidence scope:_ CLAUDE.md, README setup instructions, and the current MCP implementation.
  - _Review prompt:_ Review CLAUDE.md for drift against the code and README setup documentation for current client and configuration instructions.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Update the affected documentation from verified implementation evidence, or record a gap or explicit exclusion.

## CFG — Configuration

→ [standard](standards-mcp-servers.md#2-config-injection)

Configuration is loaded once, injected explicitly, and absent from ambient implementation state.

- **CFG-1 [M + J] — Injected configuration surface** — config/index.ts exports loadConfig, loads .env through process.loadEnvFile, and refers to ACCESS_LEVELS, ACCESS_LEVEL_RANK, and AuditLogMode; ambient process.env reads elsewhere are surfaced. (standards-mcp-servers.md#2-config-injection)
  - _Remediation:_ diagnostic — Correct the configuration surface and ambient reads with the owning implementation decision.
  - _Evidence scope:_ Configuration loading, injection boundaries, and configuration-dependent tests across the MCP implementation.
  - _Review prompt:_ Verify loadConfig(env?) is the only environmental reader, no module-level config singleton exists, config is the first argument of every main/utils entry point, Config contains the standard audit and access fields, and tests use literal config rather than environment mutation.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Refactor only with the owning implementation decision, or record a named gap or explicit justified exclusion.

## UTIL — Shared utilities

→ [standard](standards-mcp-servers.md#5-audit-logging)

The shared access, annotation, and audit-log utilities are present.

- **UTIL-1 [M + J] — Shared audit logging helper** — utils/audit-log.ts is present as the shared audit-log helper. (standards-mcp-servers.md#5-audit-logging)
  - _Remediation:_ diagnostic — Restore the required shared utility from the owning implementation and security decision.
  - _Evidence scope:_ Audit logging and every tool error envelope in the MCP implementation.
  - _Review prompt:_ Verify audit logging never captures secrets and tool errors are errorResult envelopes so the audit wrapper sees them.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Make security-sensitive changes only with the responsible authority, or record a named gap or explicit exclusion.

## TEST — Test wiring

→ [standard](standards-mcp-servers.md#9-tsconfig--vitest--biome)

Selected Vitest coverage excludes generated and pure-wiring MCP layers.

- **TEST-1 [M] — MCP coverage exclusions** — When a Vitest config exists, coverage excludes mcp-server/index.ts, tools wiring, utils/annotations.ts, and src/generated/. (standards-mcp-servers.md#9-tsconfig--vitest--biome)
  - _Remediation:_ diagnostic — Adjust the Vitest coverage exclusions using the repository test-policy decision.

## TOOL — Tool surface

→ [standard](standards-mcp-servers.md#3-tool-naming)

Tool names, result envelopes, schemas, and registration order form a stable MCP surface.

- **TOOL-1 [M + J] — MCP tool surface** — Registered tool names use snake-case app/resource/action forms; structured output declares outputSchema; and group registration order is stable. (standards-mcp-servers.md#3-tool-naming, standards-mcp-servers.md#12-spec-conformance-tool-results-errors--metadata)
  - _Remediation:_ diagnostic — Correct the observed tool surface with the owning API and security decisions.
  - _Evidence scope:_ The full public MCP tool surface, result envelopes, annotations, documentation, and applicable OAuth requirements.
  - _Review prompt:_ Review plural/singular resource choices, CLI mirroring and README catalogues; confirm the annotation-driven access gate, annotation presets, dry-run defaults, read default, audit/error envelopes, path and subprocess hardening, bounded schemas, error aggregation, output sanitisation, and the applicable OAuth security requirements. Optional metadata remains opt-in.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Make API or security changes only with the owning authority; otherwise record a named gap or explicit justified exclusion.

## PKG — Package entry points

→ [standard](standards-mcp-servers.md#8-packagejson)

The package exposes the compiled MCP server, configuration, and manifest surfaces.

- **PKG-1 [M] — MCP package entry points** — package.json has the MCP main and bin target plus ., ./config, and ./package.json exports. (standards-mcp-servers.md#8-packagejson)
  - _Remediation:_ automatic

## SCR — MCP scripts

→ [standard](standards-mcp-servers.md#8-packagejson)

Runtime, auth, client-generation, and recording scripts expose the expected explicit commands.

- **SCR-1 [M + J] — MCP scripts** — MCP server scripts are present, typed-client generation is required, auth-server scripts are paired, and record/replay scripts travel together. (standards-mcp-servers.md#8-packagejson)
  - _Remediation:_ diagnostic — Add or correct the declared scripts with the owning runtime and release decision.
  - _Evidence scope:_ Generated client outputs and the explicit generation and smoke commands declared by the package.
  - _Review prompt:_ Verify generated typed-client files are committed and current; where generation is needed, run bun run ki:generate:client explicitly outside hosted conform.
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Run the explicit command, update reviewed generated outputs, or record a named gap or explicit exclusion.

## CI — Smoke CI

→ [standard](standards-mcp-servers.md#8-packagejson)

Smoke-test wiring is mechanically visible while execution remains an explicit external step.

- **CI-1 [M] — MCP smoke CI** — When ki:test:smoke is defined, ci.yml invokes it after the common engineering gate. (standards-mcp-servers.md#8-packagejson)
  - _Remediation:_ diagnostic — Add the smoke invocation to the CI workflow when the declared smoke script exists.
- **CI-2 [M] — MCP smoke execution** — When ki:test:smoke is defined, its execution remains an explicit verification step outside hosted audit and conform. (standards-mcp-servers.md#8-packagejson)
  - _Remediation:_ diagnostic — Run the declared smoke script explicitly and investigate its result outside hosted audit or conform.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
