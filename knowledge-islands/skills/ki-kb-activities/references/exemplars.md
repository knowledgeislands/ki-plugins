# Exemplars

## Slash-command activity

```yaml
---
status: active
realization: slash-command
skill: ki-kb-base
author: Written with Claude
---
```

```markdown
# KB Audit

Runs `ki-kb-base` AUDIT mode on demand to check the base structure against the KB standard.

Adopted because the KB grows rapidly and manual structure reviews are error-prone.
```

## Scheduled-task activity

```yaml
---
status: active
realization: scheduled-task
schedule_name: Morning Briefing
schedule_env: cowork
author: Written with Claude
---
```

```markdown
# Morning Briefing

Runs each working day at 06:00. Reads the calendar, active streams, and any outstanding items, then produces a briefing note in Calendar/.

Verify registration in Claude Cowork — see [[Admin/Governance/Charter|Charter]] for adoption position.
```

## Conversational activity

```yaml
---
status: active
realization: conversational
author: Written with Claude
---
```

```markdown
# Weekly Review

A recurring conversation with the island custodian each Friday to review the week's captures, route outstanding notes, and update the active streams. No external artefact — invoked by the user.
```
