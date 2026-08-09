# Candidate-finding standard

REVIEW and EXTRACT are judgment-led discovery modes. Their result is a compact proposal set for a user to assess, not permission to change a skill, a roadmap, or a plan.

## Candidate shape

Each candidate has all of these fields:

| Field             | Required content                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Title             | A concise capability or improvement name.                                                    |
| Evidence          | One or more concrete paths, observed repetitions, or explicitly selected history references. |
| Disposition       | Exactly one of the values below.                                                             |
| Roadmap treatment | `new item`, `amend existing item`, or `no roadmap work`.                                     |
| Proposed action   | The smallest useful next action and its owner.                                               |

Allowed dispositions are:

- `keep as guidance` — the material is specific, infrequent, or judgment-heavy; improve the skill prose only when the user requests it.
- `move to reference` — the material belongs on demand rather than in the loaded skill body.
- `extract script` — a bounded, repeatable, deterministic operation deserves a documented executable helper.
- `new skill` — the work has an independent trigger, stable scope, and reusable procedure.
- `new agent or hook` — the work is a bounded delegated role or an event-driven enforcement point rather than a skill procedure.
- `not worth formalising` — record the reason and do not create an artefact.

Use this readable report shape:

```markdown
## Candidate findings

### Extract the duplicate-scan helper

- **Evidence:** `scripts/a.ts` and `scripts/b.ts` repeat the same content-hash scan.
- **Disposition:** extract script
- **Roadmap treatment:** amend existing item — `foundation-tooling/review-ki-bootstrap-for-further-simplification`
- **Proposed action:** add a pure scan helper and focused tests; retain judgment over which files are candidates.
```

## Reconcile and route

1. Read the target repository's canonical roadmap and run its read-only `ki-change-management-roadmap` audit before proposing a durable route.
2. Compare each candidate against existing items by concern, scope, and evidence; treat a similar title as a review prompt, not proof of duplication.
3. Present only the deduplicated candidate set, including whether each is a new item, an amendment, or no roadmap work. Stop for the user's explicit decision.
4. After the user confirms a roadmap change, use the repository's ordinary roadmap process to make it. Let `ki-next` select and promote eligible work; let `ki-plan` create and progress a plan only when the user requests planned execution.

Neither REVIEW nor EXTRACT writes a roadmap, plan, skill, script, agent, hook, or transcript-derived memory. Historical material is read only when the user names its path or otherwise selects its exact scope.
