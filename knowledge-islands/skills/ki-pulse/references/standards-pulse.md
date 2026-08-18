# Pulse standard

Load this standard for any Capture, Scan, or Triage operation.

## Invocation-scoped scan brief

A Scan brief contains:

- one or more explicit interests or discovery queries; and
- optionally, a bounded list of public sources.

An absent or empty interest/query set is invalid. The brief exists only for the current invocation. Do not save it as configuration, turn it into a subscription, infer additional interests, or expand beyond its named sources and queries. A later invocation may reuse a brief only when the user supplies it again.

Inspect no more than ten leads. Return no more than five observations, cited and ordered by relevance to the brief. Discovery surfaces and repeated appearances may identify a lead; popularity is neither quality evidence nor durable-work authority.

## Common signal record

Keep the following fields for every captured or scanned signal, using `unknown` rather than invention:

- **Source:** submitted URL or source identity, plus a primary-source citation when one supports an actionable claim.
- **Observed:** observation date.
- **Title and author:** only when resolvable from accessible evidence.
- **Context:** the user's reason, declared interest, or discovery query that brought the signal into scope.
- **Relevance:** why the signal may matter to that context, without presenting fit as established fact.
- **Access:** `read`, `partially accessible`, or `unread / content unavailable`, with the limitation stated.
- **Uncertainty:** unresolved metadata, claims, applicability, or destination assumptions.
- **Disposition:** exactly one of `Read / learn`, `Watch`, `Act`, or `Discard` after Triage.
- **Proposed destination:** the runtime-resolved owner, or `none / unavailable`.

Capture records one explicit source. It may preserve an inaccessible link as an unread candidate, but must not infer its title, topic, or claims from surrounding hints. Scan records only the bounded observations returned from its current brief. Triage does not reopen earlier history.

## Evidence rule

Use a primary source where one exists before treating a technical or governance claim as actionable. Release notes, official documentation, standards text, or the project's own publication can establish what changed; a secondary post or discovery index can only identify the lead until corroborated.

Record unavailable, blocked, partial, or conflicting evidence plainly. Do not claim to have read content that was inaccessible. A reading candidate may remain deliberately unread; an actionable claim may not substitute speculation for missing primary evidence.

## Exactly one disposition

Choose one disposition per signal:

- **Read / learn:** worthwhile for later reading or personal learning, without asserting a required change.
- **Watch:** no present action, but a specific future condition could change the assessment.
- **Act:** verified evidence supports either refreshing an owned normative contract or proposing finite work.
- **Discard:** insufficient relevance, evidence, novelty, or fit; create no durable artifact.

Do not combine dispositions. When a signal appears to need both learning and action, choose the immediate outcome that the evidence supports and mention the other possibility only as uncertainty, not a second disposition.

## Destination ownership

A disposition does not grant Pulse ownership of its destination:

- Route **Read / learn** to `ki-repo-kb` SAVE only when the selected repository is the intended Knowledge Base. If another declared repository owns it, use `ki-trades`.
- Add **Watch** only to an existing owning record with a named monitoring trigger. If no such record exists, keep it transient; do not create a Pulse log or subscription.
- Route **Act** from a changed normative source to the owning governance skill's REFRESH mode. Present other finite work to `ki-next` in the owning repository; Pulse neither creates nor selects that work itself.
- **Discard** writes nothing.

Durable read, watch, and act hand-offs require explicit user authority and the destination owner's normal gates. If the owner is absent, unresolved, remote-only, or refuses the hand-off, report `none / unavailable` and create no artifact. Never write directly into another repository or destination as a shortcut.
