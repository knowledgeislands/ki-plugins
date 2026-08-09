# GitHub Issues adapter standard

## Configuration

Select the adapter and name exactly one GitHub repository.

```toml
[skills.ki-change-management]
adapter = "github-issues"

[skills.ki-change-management-github-issues]
repository = "owner/repository"
```

`repository` is the issue namespace. A canonical record reference is `owner/repository#123`; the number is allocated by GitHub and never reused. Do not substitute a title, URL fragment, or local counter as identity.

## Lifecycle mapping

The open Issue is the canonical record. Labels or project fields may express queue placement, readiness, and review state only when the repository documents their exact mapping. Closing an Issue is the shared `done` transition. GitHub does not provide a safe general prune operation: `ki-accept prune` retains closed Issues unless a separately authorised repository-retention policy names a reversible archive action.

Use the Issue body and comments for plan, delivery, and review evidence. A process skill never assumes an Issue is Ready merely because it is open, and never infers acceptance from a merged pull request.

## Authority and conflicts

Read-only discovery is allowed when the user asks to inspect configured work. Creating, editing, relabelling, assigning, closing, reopening, or transferring Issues requires confirmation of the exact remote write set. Re-read each Issue immediately before a write; stop on a changed lifecycle field, conflicting human update, missing permissions, or uncertain repository identity.
