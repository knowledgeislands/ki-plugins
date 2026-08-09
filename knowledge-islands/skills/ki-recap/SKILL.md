---
name: ki-recap
ki-kind: process
ki-depends-on: []
description: >
  Recaps a live session: summarises changes, decisions, and files; surfaces only unfinished session work; and routes durable learnings. Use for "recap this session", "what's outstanding", or "harvest what we learned". It does not select backlog work—that is `ki-next`—or mechanically mine historical transcripts.
argument-hint: 'recap [--runtime detect|claude|codex] [--transcript <session-file>] | help'
---

# ki-recap

**Kind:** process. Recaps a **live** session — warm, in-context, run inside the session itself. Full procedure in [the session-recap standard](references/standards-session-recap.md).

## What this skill does

Three legs, always in this order:

1. **Summarise** what happened this session — changes, decisions, files touched.
2. **Surface what is outstanding** — only unfinished threads and explicitly deferred fixes from this session. Always check whether the session's work is fully committed — dirty files this session touched are outstanding; dirty files from other threads and generic future work are out of scope. A roadmap item or Stream **added this session** is "what happened", not outstanding.
3. **Harvest the learnings** — dead-ends, workarounds, conventions discovered in-session — and route each through the [knowledge-promotion standard](../../governance/ki-authoring/references/standards-knowledge-promotion.md): distinguish a durable learning from unfinished work, then choose its narrowest appropriate owner. Confirm with the user before writing anywhere durable.

When the user asks for coverage, or several materially different discussion points would otherwise be hard to trace, add a bounded **Discussion coverage** matrix after the three legs and before Actions. It is an optional reviewer aid, never a fourth source of truth or a claim of transcript completeness; the full procedure fixes its four columns, closed dispositions, and evidence limits.

The recap always closes with an **Actions** section: a concrete, imperative checklist of only the current session's unfinished work (files to commit, gates to re-run, approved learning routes to apply) — or a one-line "no actions" if the tree is clean and nothing is outstanding. Do not turn roadmap backlog, peer state, or prospective work into an action; `ki-next` owns selecting or sequencing that work. Prefix each action with a short, unique, uppercase hyphenated label that names the work, rather than an arbitrary sequence number (for example, `FIX-AUTHORING-AUDIT`). It is a checklist for the user, not actions taken unprompted.

When `ki-accept` asks for a work-record mini recap, use the same grounding and learning-routing boundary in the smaller item scope: delivered work, verification evidence, outstanding concerns, and proposed learning routes. In a non-KB repository, cite the item by its canonical `<REPO>-<NNN>` or area-qualified `<REPO>-<AREA>-<NNN>` identifier; in a KB, cite the proposal path. The roadmap item's `## Review` section or proposal review evidence is not permission to promote a learning outside that record.

When the user wants to select or sequence future work after a recap, route that separate request to `ki-next`. Do not present it as an action, invent a future-work checklist, or invoke `ki-next` from the recap itself.

The boundary after every recap and before a new work cycle **is** a compaction boundary: compact by default there rather than waiting on a context-pressure reading. Preserve only what is in scope for that next cycle, then use the documented runtime- or vendor-specific compaction mechanism to reduce the active context to that scope. Two conditions withhold the default — the recap has not yet recorded the durable outcome (an active change, unresolved tool operation, or uncommitted implementation unit), or no substantive work has entered context since the last compaction, the minimum-footprint floor that stops a recap and an immediately following `ki-next` compacting twice across an unchanged span. The applicable `ki-tokenomics` runtime adapter owns the mechanism's evidence boundary; Claude Code exposes an invocable mechanism, Codex compacts only automatically, and where none can be invoked, say so plainly — a digest alone is useful handoff material, not context reduction.

The recap grounds every checkable claim in current reality, not in warm context or recalled memory: before asserting a commit landed, a gate passed, or a file's state, it re-checks (`git log`, the read-only gate, a fresh read) — stale context otherwise reads as fact.

A mechanical **grounding helper**, [`scripts/recap-grounding.ts`](scripts/recap-grounding.ts), resolves the newest matching Claude or Codex session transcript and emits files-touched, tool-tally, high-cost-candidate, and versioned repository-evidence data. On a later recap it compares a compatible prior evidence marker and reports `unchanged`, `changed`, or `unavailable`; current Git state remains authoritative. It grounds the summarise and harvest legs, it does not replace judgment over them.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. With no argument, run the three-leg procedure over the current session, then preserve a carry-forward digest and compact unless a safety or minimum-footprint condition withholds it. Grounding uses `--runtime detect` by default, selecting the newest repository-matching Claude or Codex transcript; use `--runtime claude` or `--runtime codex` to force one runtime. `--transcript <session-file>` selects one eligible candidate by basename only when concurrent sessions make modification time ambiguous.

## Notes

- No universal AUDIT/CONFORM/EDUCATE/REFRESH modes — this is a process skill (ADR-KI-HARNESS-SKILLS-001, ADR-KI-HARNESS-SKILLS-006); it has one procedure with an optional coverage matrix.
- Sibling to the offline, mechanical "mine historical sessions" ROADMAP candidate — that is the **cold** leg (after the fact, over stored transcripts); this is the **warm** leg (in-session, while context is live). They share the grounding substrate and the routing table, not an implementation.
- Installed as a core user skill by `ki bootstrap` — usable in any repo on the machine. Like `ki-bootstrap`, it is not a repository-governance root and has no `[skills.ki-recap]` table.
