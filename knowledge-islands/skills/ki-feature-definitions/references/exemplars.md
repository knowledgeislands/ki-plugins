# Exemplars

Shapes to copy when authoring a Feature Definitions corpus. Adapt names and prefixes to the repo; do not copy wholesale. The full standard is [feature-format.md](feature-format.md).

## An `index.md` skeleton

```markdown
# Feature Definitions

The behaviour-level contract for what this system does — the **what** (decisions are the why, guides are the how). Each requirement is as-built and testable; a test suite checks the system against it.

## How to read a requirement

Each requirement is a level-3 heading `### <PREFIX>-NNN — <title>`, one RFC-2119 statement, and a `_Verify:_` hook. For example:

    ### AUTH-004 — Session cookie is HttpOnly

    The session cookie MUST be set with `HttpOnly` and `Secure` attributes.

    _Verify:_ a login response sets `Set-Cookie: session=…; HttpOnly; Secure`.

RFC-2119 keywords (`MUST` / `MUST NOT` / `SHOULD` / `SHOULD NOT` / `MAY`) are normative and uppercase. `_Verify:_` names the concrete check.

## ID scheme

`<PREFIX>-<NNN>` — a per-file prefix plus a zero-padded three-digit serial, sequential within the file. IDs are **append-only and never reused**: a retired requirement keeps its number, struck through with a `(deprecated)` note. Never renumber to tidy up.

## Gaps

Each area file ends with a `## Gaps` section of **unnumbered** bullets — known divergences or desirable-but-unbuilt behaviours, deliberately outside the as-built contract. Promote a gap to a numbered requirement only once it is built and true.

## Areas

| File              | Prefix | Covers                    |
| ----------------- | ------ | ------------------------- |
| authentication.md | AUTH   | Login, sessions, tokens   |
| billing.md        | BILL   | Plans, invoices, webhooks |
```

## An area file skeleton

```markdown
# Authentication — AUTH

Login, session, and token behaviour. Part of the Feature Definitions corpus; see [index.md](index.md).

> **Status:** as-built baseline, behaviour-level.

## Sessions

### AUTH-001 — Session lifetime

A session MUST expire 14 days after issue, and MUST be renewed on any authenticated request.

_Verify:_ `auth/session.test.ts` asserts a token minted at T is rejected at T + 14d and refreshed on use.

## Gaps

- No requirement yet covers multi-device session revocation; only whole-account logout exists.
```

## A requirement governed by a decision

```markdown
### BILL-007 — Proration on plan change

When a customer changes plan mid-cycle, the system MUST prorate the invoice to the day, per [ADR-BILLING-002](../decisions/ADR-BILLING-002-proration.md).

_Verify:_ `billing/proration.test.ts` covers an upgrade on day 10 of a 30-day cycle.
```
