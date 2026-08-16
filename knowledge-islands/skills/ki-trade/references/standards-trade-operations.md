# Trade-operations procedure

`ki-trade` applies the record, route, authority, and lifecycle contract owned by `ki-trades`. Every operation is local to the selected physical repository.

## Contents

- [1. Preflight](#1-preflight)
- [2. Manage routes](#2-manage-routes)
- [3. Prepare and observe](#3-prepare-and-observe)
- [4. Submit or abandon](#4-submit-or-abandon)
- [5. Receive](#5-receive)
- [6. List and show](#6-list-and-show)
- [7. Release and prune](#7-release-and-prune)
- [8. Finish](#8-finish)

## 1. Preflight

1. Resolve the selected physical Git root and its declared `ki-repo` identity.
2. Run `ki repo audit --skill ki-trades --repo <root>` and stop on a failure or warning. Re-run it after a mutation. These are operator checks: the current trade host does not establish them as pre/post transaction enforcement. A pending one-sided export route may support preparation but not receipt.
3. Resolve every peer only through the registered repository inventory and canonical repository identity. Filesystem visibility alone grants no route or write authority.
4. Inspect current committed state before any operation that reads a preparation. Uncommitted peer content is not an observable proposal.

Never write outside the selected repository, fetch or push as an implicit transport step, or infer a receiver decision from file presence or silence.

## 2. Manage routes

Use `ki trade routes add`, `remove`, `list`, or `check` against the selected repository.

`add` changes only the selected local configuration. A sender export may remain pending while the receiver is unregistered or has not declared the matching import. Report that pending state distinctly from an active reciprocal route.

`remove` first resolves the exact typed route and refuses without writing when a local preparation, submitted outbound, or retained inbound still depends on it. Present those record identities so the user can resolve their lifecycles deliberately; never abandon, release, prune, or rewrite them as part of route removal.

`list` and `check` distinguish:

- the local sender's declared observation route, which permits preparation and submission; and
- active reciprocal receipt, which additionally requires the matching receiver import and an unambiguous registered endpoint.

## 3. Prepare and observe

### Prepare

`ki trade prepare <receiver> --kind <work|knowledge> --observation <policy>` creates one sender-local mutable preparation with its final trade identity. Require a declared export route; reciprocity may still be pending.

Choose exactly one observation policy:

- `unattended` — request no response and retain through observable receipt;
- `receipt` — observe only creation of the receiver copy;
- `decision` — observe a terminal receiver decision; or
- `completion` — for adopted work, observe the linked local item becoming done; direct application or retained knowledge satisfies the observation directly, while decline or supersession resolves it without completion.

The preparation remains mutable and may be committed repeatedly. Do not create a receiver copy, acknowledgement, comment thread, or separate revision record.

### Observe

`ki trade observe <TRD>` is receiver-local and read-only toward the sender. Resolve exactly one registered sender root and compare the current committed preparation with the host-local full commit cursor from the previous observation.

Show the committed diff only when the cursor and current commit share comparable Git history. On first observation, rewritten or shallow history, or any other comparison failure, show the complete current record verbatim and explain why no diff is available. Update only the host-local observation cursor after a successful view; never create repository state or disclose the view to the sender.

## 4. Submit or abandon

`ki trade submit <TRD>` must validate one complete preparation and preview its canonical outbound path before changing it. The operation is permitted only when the host demonstrates the transaction boundary it claims; this procedure does not certify atomicity merely because the command exists. Submission changes the same identity to submitted state, freezes its envelope and payload, and consumes the preparation. It does not require an active reciprocal import and does not create the receiver copy.

`ki trade abandon <TRD>` applies only to one preparation. Present its exact path and require confirmation before deleting it because abandonment removes the current mutable artifact; committed Git history remains recoverable. Refuse after submission and never convert abandonment into sender release.

## 5. Receive

`ki trade receive <TRD>` requires one explicit submitted identity and an active reciprocal route for its kind. Preview the sender source and receiver destination, preserve the immutable sender projection byte-for-byte, add only the receiver-owned fields, and record the committed sender reference when it is available.

`ki trade receive --all` is a convenience operation over independent asynchronous receipts. Its preview lists the identities receivable at that point; with confirmation, the host attempts each listed identity sequentially. A later failure does not retract an earlier receipt, and a preview neither promises that every outbound file was evaluated nor grants receiver authority. Report the actual local results; use one explicit identity when an operator needs a single-record boundary.

Receipt begins at `unconsidered`. It is not acceptance, retention, adoption, priority, or completion. Hand the inbound record to `ki-next` for receiver disposition.

## 6. List and show

`ki trade list` reports preparations, submitted records, received records, observable delivery facts, receiver decisions, observation policy, and current release or prune eligibility without collapsing them into one status.

`ki trade show <TRD>` resolves one identity and labels sender-owned immutable fields separately from receiver-owned local fields. It may show observable peer state but changes neither repository.

## 7. Release and prune

`ki trade release <TRD>` removes only the selected sender's outbound copy after the record's observation policy is satisfied. `--eligible` previews the complete eligible local set and requires confirmation before a bulk deletion. An unattended submission is not eligible before receipt.

`ki trade prune <TRD>` removes only the selected receiver's inbound copy after matching sender release is observable. `--eligible` uses the same preview, complete-set validation, and confirmation boundary. Never infer release from a terminal decision alone.

A completion-observation trade retains the linked adopted local work record until sender release is observable. The local trade checker has no selected-adapter, owner-valid completion resolver, so an adopted completion trade is ineligible for release and pruning until that host-owned evidence exists. Report that reference as a pruning guard; do not remove the work record as part of trade cleanup.

## 8. Finish

Run the local `ki-trades` audit after every mutation. Report the operation, exact local paths changed or removed, observation policy and next observable condition, pending reciprocity where relevant, and audit result. Do not report atomicity or pre/post-audit enforcement unless the host produced that evidence.

For a received record, name `ki-next` as the next decision step. For an adopted work item that reached done, name sender release observation before either side prunes the remaining evidence.
