# REVIEW procedure

Use REVIEW for an existing skill or skill set when the question is architectural evolution rather than rubric conformance alone.

1. Require an explicit skill or repository target. Run AUDIT first and retain its mechanical result; resolve conformance failures before proposing optimisation.
2. Read the selected `SKILL.md`, its on-demand references, executable helpers, tests, and the adjacent implementation that the skill governs. Identify repeated deterministic procedures, expensive loaded detail, trigger collisions, unclear ownership, and work that belongs in another automation shape.
3. Apply the [candidate-finding standard](standards-candidate-findings.md). Prefer the smallest suitable disposition: a reference before a script, a script before a new skill, and a skill before a standing agent or hook only when the trigger and scope are genuinely independent.
4. Reconcile the candidates with the canonical roadmap through the candidate-finding standard. Present the proposed routes and stop for confirmation; the review itself changes nothing.

AUDIT answers whether a skill meets the current standard. REVIEW answers how it could evolve without weakening its scope, safety, or token economy.
