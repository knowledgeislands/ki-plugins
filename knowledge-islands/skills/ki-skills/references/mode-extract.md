# EXTRACT procedure

Use EXTRACT to inspect a repository for reusable capabilities. It is opt-in for history: `extract <repo>` inspects current repository material only; `--history <path>` permits reading only the named history input.

1. Resolve the explicit repository target and run its applicable read-only checks. Inventory its skills, scripts, automation, guides, tests, and roadmap. Do not discover, scan, or read ambient session history.
2. If one or more `--history` paths are supplied, confirm each is within the user-selected scope and read only those inputs. Treat history as supporting evidence, not as authority over the current repository state.
3. Identify repeated operations, recurring decisions, handoff friction, duplicated implementation, and missing capability boundaries. Apply the [candidate-finding standard](standards-candidate-findings.md); distinguish a deterministic script opportunity from a judgment-led skill procedure.
4. Reconcile the resulting candidates with the canonical roadmap through the candidate-finding standard. Present the deduplicated set and stop for explicit user confirmation before any durable change.

EXTRACT is discovery, not generation. It does not create a skill, script, agent, hook, roadmap item, plan, or retained transcript artefact.
