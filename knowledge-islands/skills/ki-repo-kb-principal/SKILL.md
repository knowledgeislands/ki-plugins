---
name: ki-repo-kb-principal
ki-kind: governance
ki-depends-on: [ki-repo-kb, ki-decision-records]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs a principal Knowledge Islands knowledge base: the canonical shared island from which governance, durable knowledge, decisions, and cross-island routes are maintained. Use when auditing, establishing, or conforming a principal knowledge base; its governance home, Enactment gate, charter, memory root, canonical zones, or incoming and outgoing handoffs. A governance skill: it composes ki-repo-kb and ki-decision-records, while local identity and integrations remain declared in the principal repository.
argument-hint: 'audit | conform | educate | help | refresh'
---

# Principal Knowledge Base

This governance skill holds the portable contract for a principal Knowledge Islands base. Read [the principal standard](references/standards-principal.md) before acting and [the generated rubric](references/rubric.md) for the checkable floor.

## Shared model

A principal is a canonical, shared Knowledge Base. It uses the `ki-repo-kb` zones and `ki-decision-records` collection, then adds a governance home: `Admin/Governance/Charter.md`, `Admin/Governance/Known Lands.md`, `Admin/Governance/Conventions/Conventions.md`, and `Admin/Operations/Processes/Enactment Process.md`. `Admin/MEMORY.md` remains the root memory anchor.

Substantive changes to `Admin/`, `Pillars/`, and `Resources/` must originate in a Stream proposal under the Enactment Process. This standing gate is anchored in the repository's always-loaded `CLAUDE.md` or `AGENTS.md`; the rubric verifies the anchor exists.

Repository identity, community language, integrations, and local operating detail belong in the principal's own governance notes, never in this shared skill.

## Operating modes

### Mode AUDIT

Run `ki repo audit --skill ki-repo-kb-principal --repo <repo>`, then judge whether the charter, conventions, and Enactment Process actually describe the local principal rather than empty scaffolding.

### Mode CONFORM

Run `ki repo conform --skill ki-repo-kb-principal --repo <repo> --dry-run` first. The native checker reports the missing principal surface; establish it through EDUCATE or an approved local proposal. CONFORM never moves knowledge, creates a Stream proposal, or reclassifies an existing folder.

### Mode EDUCATE

Establish the principal overlay after `ki-repo-kb` has established its zones: add the governance and process entry points, then review and author their local content before declaring the base operational.

### Mode HELP

Describe the principal-only governance delta and route general base structure to `ki-repo-kb`.

### Mode REFRESH

**Precondition:** REFRESH writes only the canonical `ki-repo-kb-principal` files in `ki-agentic-harness`. From an installed copy, stop and route reusable pressure back to this harness.

Reconcile repeated principal-base experience into the standard and rubric; do not turn one island's identity into a shared rule.

## Notes

- `ki-repo-kb` owns generic knowledge-base zones, streams, activities, and live artefacts.
- `ki-decision-records` owns Decision Record format and collection integrity.
- A satellite or ordinary knowledge base does not declare this skill.
