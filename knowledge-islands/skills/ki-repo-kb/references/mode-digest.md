# Mode DIGEST — session digest

_On-demand procedure for kb's DIGEST mode. The shared model — the five-zone structure, routing test, memory cascade, project bindings, and Step 1 (Load context) — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

## Why `-/`, not Calendar or Streams

A digest is a **produced artefact** that documents a session — it has left the active knowledge cycle. This places it in outbound staging (`-/`), not in the base's living structure:

- **Not Calendar** — Calendar notes are time-stamped records you keep. A digest is an output you can discard once its useful content is extracted into canonical notes or routed through `ki-trades`.
- **Not Streams** — Streams notes are _work in motion_, driving further action inside the base. A digest captures work that is settled (at least temporarily) and carries no pending action of its own.

Once the content it holds is extracted, a digest can be deleted. Test: if you deleted this note today, would knowledge be lost? If yes, extract first; if no, delete.

Retain `-/_DIGESTS/README.md` while `ki-repo-kb` is declared. It is the capability scaffold, not a digest record, and EXTRACT or retention cleanup must never remove it.

## Session digest

1. Write the digest to `-/_DIGESTS/<UTC timestamp> <Short Topic>.md` (timestamp `YYYY-MM-DDTHHMMSSZ`; topic in Title Case).
2. Carry `note_type: session-digest` and `retain_until: YYYY-MM-DD` (default 30 days out).
3. Structure: Context, Decisions, Facts Learned, Related Work, Keywords.

## Cross-repository handoff

A cross-repository handoff uses `ki-trades`, which owns its preparation, peer-qualified `-/_TRADES/<owner>/<repo>/TRD-<eight-hex>.md` path, metadata, receipt, and retention. Route the request to that skill; DIGEST does not create a separate handoff note or confer authority to write into the receiving repository. The local session digest remains independently useful until its content has been extracted or routed.

The former direct timestamped `-/_TRADES/*.md` format and `note_type: handoff` are retired. Review any retained legacy note for migration through `ki-trades`; do not relabel it as a digest or delete useful content merely to pass an audit.
