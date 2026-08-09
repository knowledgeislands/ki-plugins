# Streams container exemplars

These illustrations show the KB placement contract. They do not prescribe a base's repository code, roadmap areas, topical vocabulary, or historic migration map.

## Target structure

```text
Streams/
  Roadmap/
    _ISSUES.md
    KB-OPS-001-establish-streams-container.md
    KB-GOV-002-record-local-authority.md
  Housekeeping/
    Weekly Knowledge Review Housekeeping.md
```

`Streams/Roadmap/` is flat. Horizon and lifecycle are frontmatter in each record, not folders. `Streams/Housekeeping/` contains recurring-work templates; a due template spawns a linked roadmap record rather than being moved to an attention folder.

## Legacy migration decision

| Legacy record | Deliberate destination |
| --- | --- |
| `Streams/Active/Review Practice Proposal.md` | Flat roadmap item, if it is finite forward work. |
| `Streams/Background/Monthly Review.md` | Housekeeping template, if it is a recurring obligation. |
| `Streams/Dormant/Knowledge Model.md` | Canonical knowledge, if it has become settled subject matter. |

The owner confirms every classification. The legacy path never determines the new identifier or optional topical metadata.
