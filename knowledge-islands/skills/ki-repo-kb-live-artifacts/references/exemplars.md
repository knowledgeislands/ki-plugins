# Exemplars

## Minimal active artifact

`Admin/Operations/Live Artifacts/Status Board.md`:

```yaml
---
status: active
renders: html
author: AI-assisted
---
```

```markdown
# Status Board

| Area    | Status  | Last updated |
| ------- | ------- | ------------ |
| Streams | 2 open  | 2026-06-27   |
| Inbox   | 0 items | 2026-06-27   |
```

The paired `Status Board.html` is generated from this source and lives in the same directory.

## Index entry

`Admin/Operations/Live Artifacts/Live Artifacts.md` entry:

```markdown
| Status Board | active | Current open streams and inbox count. |
```

## Archived artifact

```yaml
---
status: archived
renders: html
archived: 2026-06-01
archive_reason: Replaced by the consolidated Status Board.
author: AI-assisted
---
```
