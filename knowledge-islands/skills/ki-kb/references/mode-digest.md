# Mode DIGEST — session digest and handoff

_On-demand procedure for kb's DIGEST mode. The shared model — the five-zone structure, routing test, memory cascade, project bindings, and Step 1 (Load context) — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

## Why `-/`, not Calendar or Streams

A digest is a **produced artefact** that documents a session — it has left the active knowledge cycle. This places it in outbound staging (`-/`), not in the base's living structure:

- **Not Calendar** — Calendar notes are time-stamped records _you keep_. A digest is an output you hand off or discard once its content has been extracted into Pillars, Streams, or a handoff note.
- **Not Streams** — Streams notes are _work in motion_, driving further action inside the base. A digest captures work that is settled (at least temporarily) and carries no pending action of its own.

Once the content it holds is extracted, a digest can be deleted. Test: if you deleted this note today, would knowledge be lost? If yes, extract first; if no, delete.

## Session digest

1. Write the digest to `-/_DIGESTS/<UTC timestamp> <Short Topic>.md` (timestamp `YYYY-MM-DDTHHMMSSZ`; topic in Title Case).
2. Carry `type: session-digest` and `retain_until: YYYY-MM-DD` (default 30 days out).
3. Structure: Context, Decisions, Facts Learned, Related Work, Keywords.

## Handoff

A handoff is a digest directed at a specific recipient or base. The recipient routes it through their `+/` inbox. When the recipient is another KI repository, use the shared `+/_HANDOFFS/` and `-/_HANDOFFS/` direction and ownership convention defined by `ki-repo`; this skill continues to own the KB note's routing and frontmatter.

1. Write the handoff to `-/_HANDOFFS/<UTC timestamp> <Recipient or Topic>.md` (same timestamp format).
2. Carry `type: handoff`, `intended_for: <base or person>`, and `retain_until: YYYY-MM-DD` (default 30 days out).
3. Structure: Context, What Was Done, Open Threads, Next Actions, Assets Produced.
