# Exemplars

These shapes illustrate the [Specifications standard](standards-specs.md) but do not add requirements.

## An `index.md` skeleton

```markdown
# Specifications

The accepted behaviour and quality contract for the system — **what** it promises, distinct from decisions (why), guides (how), and work records (when).

## Reading a requirement

Each requirement uses `### <PREFIX>-NNN — <title>`, one BCP-14 statement, a current conformance state, a verification plan, and evidence when conforming.

## Areas

| File              | Prefix | Covers                    |
| ----------------- | ------ | ------------------------- |
| authentication.md | `AUTH` | Login, sessions, tokens   |
| billing.md        | `BILL` | Plans, invoices, webhooks |
```

## An area file skeleton

```markdown
# Authentication — AUTH

Accepted authentication behaviour and quality properties. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### AUTH-001 — Session lifetime

A session MUST expire 14 days after issue and MUST be renewed by an authenticated request.

_Conformance:_ conforming

_Verify:_ exercise a token at issue, renewal, and expiry boundaries.

_Evidence:_ `auth/session.test.ts` covers issue, renewal, and 14-day rejection.

## Quality properties

### AUTH-002 — Secure session cookie

The session cookie MUST use `HttpOnly` and `Secure` attributes.

_Conformance:_ pending

_Verify:_ inspect the login response `Set-Cookie` header.

## Gaps

- Decide whether multi-device session revocation belongs in the accepted contract.
```

## A divergent accepted requirement

```markdown
### BILL-007 — Proration on plan change

When a customer changes plan mid-cycle, the system MUST prorate the invoice to the day, per [ADR-BILLING-002](../decisions/ADR-BILLING-002-proration.md).

_Conformance:_ divergent

_Verify:_ run the billing scenarios for upgrades and downgrades on day 10 of a 30-day cycle.

_Evidence:_ upgrades prorate today; downgrades still apply at the next renewal.
```
