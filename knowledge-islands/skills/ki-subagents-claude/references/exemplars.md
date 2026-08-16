# Claude projection examples

Project a role already approved through `ki-subagents` into Claude Markdown/YAML:

```md
---
name: change-reviewer
description: Reviews a bounded change when evidence-backed review is requested.
tools: [Read, Grep]
---

Read the approved role contract and its named evidence before producing the bounded review.
```

The example demonstrates only native source shape. It is not evidence that the role is published, selected, activated, or executed by the host.
