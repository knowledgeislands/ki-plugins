---
name: ki-housekeeping-granola
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs read-only Granola meeting acquisition and later housekeeping. Use
  "acquire Granola meetings", "import Granola meetings", "audit Granola
  acquisition", or "reconcile Granola changes". It defines complete
  date-window discovery, folder and unfoldered routing evidence, faithful MCP
  reads, content checkpoints, amendment detection, and a separate
  human-approved retirement gate. CLI staging belongs to tools-ki; canonical
  acquisition lifecycle belongs to Arcadia.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# Granola acquisition housekeeping

Use the provider-neutral lifecycle: **acquire → stage → harvest → durable knowledge → optional source retirement**. Read [the Granola acquisition standard](references/standards-granola-acquisition.md) for enumeration, fidelity, routing, and checkpoint semantics; read [the retirement standard](references/standards-granola-retirement.md) only when evaluating eventual source release. The generated [rubric](references/rubric.md) provides the checkable review contract, and [sources](references/sources.md) tracks the volatile official MCP surface.

## What this skill owns

This skill governs how Knowledge Islands interprets Granola as a mutable communication source. It requires complete identity enumeration, faithful read-only source projections, explicit omissions, immutable acquired versions, visible receiver conflicts, repeatable checkpoints, and separation between acquisition and retirement.

Granola's official remote MCP is the selected source adapter. It supplies authentication and source reads; it does not own KI package construction, repository routing, ledgers, harvesting, trades, or retirement authority. `tools-ki` owns `ki acquire granola import`, provider-neutral KEP construction, Harbour staging, and executable reconciliation. Arcadia owns the provider-neutral lifecycle.

## Verified provider boundary

The official MCP currently exposes account information, folders, date-window meeting lists, meeting details, transcripts, and natural-language query through read-only tools. Acquisition uses structured listing, detail, and transcript operations; it does not use natural-language query as faithful source evidence. Any unexpected mutation-capable tool, missing stable UUID, saturated unsplittable date window, or unhashable source projection fails closed.

The MCP exposes no native pagination, completeness indicator, update version, source URL, media, or deletion tombstone in the verified surface. The standard therefore requires caller-managed date-window splitting, query-context folder evidence, inferred unfoldered membership, and explicit content revalidation rather than pretending those capabilities exist.

## Operating modes

### Mode HELP

Explain the skill's purpose, invocation, modes, source boundary, and off-ramps, then stop without reading meeting content or changing Granola or repository state. Explicit `help`, `-h`, and `?` always take this path. With no recognisable mode, show the same explanation before offering an interactive mode choice.

### Mode AUDIT

Run `ki repo audit --skill ki-housekeeping-granola --repo <repo>` and apply the judgment criteria in the generated rubric. Review separately supplied runtime evidence for complete date-window enumeration, UUID reconciliation, source-projection hashes, receiver selection, explicit omissions, and absence of source mutation. Do not contact Granola merely to make an audit look complete; unavailable runtime evidence remains a named gap.

### Mode CONFORM

Run AUDIT first. `ki repo conform --skill ki-housekeeping-granola --repo <repo> --dry-run` may publish host-owned generated rubric material but cannot invent folder mappings, choose a receiver, contact Granola, write a KEP, change a checkpoint, or alter retirement authority. Apply authored configuration or contract corrections only after their owner approves them, then re-run AUDIT.

### Mode EDUCATE

Explain the four provider operations, complete-history window splitting, folder and unfoldered evidence, fail-closed receiver conflicts, immutable content versions, normal versus exhaustive revalidation, explicit omissions, and optional retirement gate. Do not perform acquisition or source mutation.

### Mode REFRESH

Run only against the canonical skill in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect the work to `ki-agentic-harness`; the installed copy must never write a refresh. In the canonical source, read [sources](references/sources.md), re-fetch the official Granola MCP documentation, inspect a separately approved read-only live schema, and compare tool names, inputs, entitlement limits, output fields, caps, and mutation surface with the acquisition standard and rubric. Update the source review date and every affected contract in one change; do not retain meeting content or credentials.

## Off-ramps

- `tools-ki` owns the public command, provider-neutral KEP builder, repository selection, Harbour writes, and checkpoint persistence.
- Arcadia owns the provider-neutral acquisition lifecycle and semantics shared with non-Granola sources.
- `ki-trades` owns movement of harvested knowledge or correction work between repositories.
- Granola account administration and application-managed connector disablement remain outside this skill.
