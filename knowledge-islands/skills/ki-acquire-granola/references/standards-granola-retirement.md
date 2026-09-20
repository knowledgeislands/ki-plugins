# Granola retirement standard

## Separate authority

Granola retirement is separate from acquisition, staging, harvesting, and checkpointing. Successful import does not itself authorise archive or deletion.

The official Granola MCP and the acquisition provider remain read-only. While Granola exposes no supported safe archive or delete API, the accepted operating model is a verified manual-release manifest followed by human deletion in Granola. The executor produces the manifest and stops; browser automation is not an acceptable substitute.

## Manual-release evidence gate

An exact proposed manual-release manifest remains unavailable until these conditions are independently evidenced:

1. Complete acquisition-count reconciliation across the union of receiver scopes, every folder, and inferred-unfoldered history.
2. Stable provider account, workspace, meeting UUID, acquired content hashes, and meeting version in scope.
3. A repeated exhaustive identity and content acquisition with no unexplained new, changed, missing, failed, overlapping, unmatched, saturated, or unverifiable meeting.
4. Successful checksum and source-identity verification for every receiver-local meeting document.
5. Every receiver-local copy named by a committed Git revision and sufficient source content and provenance retained for later triage and harvesting.
6. No unresolved acquisition failure, receiver conflict, uncommitted document, or omission that still requires Granola access for a manifest entry.
7. An exact manual-release manifest naming the source identity and reviewed source-version hash.
8. Explicit human approval of the exact manifest immediately before manual deletion.

A meeting that fails one gate is excluded without blocking safe release of independently verified meetings. Any source, schema, entitlement, receiver, or acquired-content change after manifest generation invalidates the affected manifest approval; regenerate and re-present the manifest rather than patching an approved list in place.

## Reconciliation after manual deletion

After the human deletes the approved list, its absence from the next complete Granola discovery is the source-side signifier that those meetings are reconciled. Receiver ledgers and committed meeting documents remain the durable acquired evidence. Later reconciliation reports only meetings still present in Granola, including new meetings and any entry previously excluded from release.

## Valid indefinite-retention outcome

Choosing not to delete a Granola meeting remains valid. In that state, Granola remains mutable working state while Knowledge Islands retains immutable observations and durable harvested knowledge.
