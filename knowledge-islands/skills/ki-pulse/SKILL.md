---
name: ki-pulse
ki-kind: process
ki-depends-on: []
description: >
  Captures an explicitly submitted link, scans a bounded public-source brief, and triages current signals into read or learn, watch, act, or discard without keeping an inbox. Use for "capture this link", "scan these interests", "what changed in these public sources", or "triage these signals". It does not select backlog work, persist subscriptions, or implement recommendations.
argument-hint: 'capture <url-or-source> [reason] | help | scan <interest-or-query> [sources] | triage [current-signals]'
---

# ki-pulse

**Kind:** process. Runs one bounded, on-demand knowledge-acquisition pulse and retains no standing state.

Read [the Pulse standard](references/standards-pulse.md) before Capture, Scan, or Triage. It defines the invocation-scoped brief, common signal shape, evidence rules, dispositions, and destination owners.

## Shared boundary

Pulse may inspect public content and user-supplied material the user is entitled to provide. It creates no Pulse-owned configuration, subscription, credential store, inbox, log, backlog, bookmark collection, or monitoring record. It does not use authenticated scraping, reopen an unbounded signal history, select work, or implement a recommendation.

Every result is transient unless the user explicitly authorises a durable hand-off and the destination owner is available. Resolve destinations from the current host and repository; never assume a personal Knowledge Base or this Harness is the owner.

## Operations

### Capture

Accept exactly one explicitly submitted URL or source and the user's optional reason for interest. A casual link mention is not capture authority.

Resolve only available metadata. If content is inaccessible, preserve the submitted source, observed date, resolvable author, user context, `unread / content unavailable`, and uncertainty. Never invent a title, subject, summary, or claim. An explicit capture request may authorise the minimal reading-candidate hand-off, but only through its destination owner.

### Help

Invoked as `help` / `-h` / `?`, explain the purpose, invocation, four operations, transient default, limits, and off-ramps, then stop without browsing or writing. With no recognisable operation and no clear contextual signal, provide the same explanation; in an interactive session only, ask which operation and required input the user intends.

### Scan

Require an invocation-scoped brief containing at least one interest or discovery query. It may also name bounded public sources. Refuse an absent or empty brief.

Inspect only the supplied interests, queries, and optional sources. Consider at most ten leads and return at most five cited observations, prioritised by relevance to the brief rather than popularity. The brief expires with the invocation: do not persist, infer, broaden, or subscribe to it.

### Triage

Triage only signals gathered or supplied for the current invocation. For each signal, preserve evidence and uncertainty, verify any actionable technical or governance claim against a primary source where one exists, and assign exactly one disposition: **Read / learn**, **Watch**, **Act**, or **Discard**.

Propose or perform no implementation. If a durable destination is unavailable or unconfirmed, return the cited disposition as transient session output and create nothing.

## Finish

Return the bounded observations with their source metadata, access state, uncertainty, exactly one disposition, and proposed destination. State what was inaccessible, what could not be verified, and which hand-offs—if any—the user authorised. Never imply that a proposed destination accepted a signal unless its owner actually did.

## Off-ramps

- `ki-repo-kb` owns saving a reading candidate in the selected Knowledge Base.
- `ki-trades` owns transport to another declared repository.
- An owning governance skill's REFRESH mode owns normative-source refresh.
- `ki-next` owns finite work capture and selection in the owning repository.
- An existing owning record owns a durable watch trigger; without one, Watch stays transient.
