# Granola retirement standard

## Separate authority

Granola retirement is a future operation separate from acquisition, staging, harvesting, and checkpointing. Successful import, verified KEP creation, an empty acquisition delta, or a retained meeting does not itself authorise archive or deletion.

The acquisition provider and official MCP remain read-only. A future retirement executor requires its own governed work, least authority, tests, review, and immediately confirmed human approval. If Granola exposes no supported safe archive or delete API, the executor produces a verified manual-release manifest and stops. Browser automation is not an acceptable substitute.

## Retirement evidence gate

An exact proposed release manifest remains unavailable until all of these conditions are independently evidenced:

1. Complete acquisition-count reconciliation across the union of receiver scopes, every folder, and inferred-unfoldered history.
2. Stable provider account, workspace, meeting UUID, and acquired content hashes for every meeting version in scope.
3. A repeat exhaustive identity and content acquisition with no unexplained new, changed, missing, failed, overlapping, unmatched, saturated, or unverifiable meeting.
4. Successful KEP checksum and manifest verification for every acquired package.
5. A recorded harvest, retention, or routing disposition for every meeting.
6. Confirmed `ki-trades` receipts for material routed to other islands.
7. A recoverable provider export or archive where Granola supports one.
8. An exact deletion manifest naming every source identity and reviewed content hash.
9. Explicit human approval of that exact manifest immediately before mutation.

Any source, schema, entitlement, receiver, KEP, disposition, or receipt change after manifest generation invalidates the manifest and its approval. The executor MUST regenerate and re-present it rather than patching an approved manifest in place.

## Valid indefinite-retention outcome

Choosing never to delete Granola meetings is valid. In that state, Granola remains mutable working state; Knowledge Islands retains immutable observations and durable harvested knowledge; routine acquisition continues to report identity, content, scope, entitlement, and omission changes. No retirement warning should imply that indefinite source retention is a failure.
