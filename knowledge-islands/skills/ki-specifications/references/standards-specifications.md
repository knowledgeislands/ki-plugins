# KI Specifications repository-structure standard

KI Specifications is a normal Knowledge Islands repository with one additional structural identity. It declares a keyless `[ki-specifications]` table and exposes seven stable top-level areas:

- `proposals/` for deliberative KIPs;
- `specifications/` for normative KIS documents;
- `schemas/` for machine-readable contracts;
- `templates/` for conformant starting points;
- `examples/` for reference packages;
- `docs/` for process, decisions, roadmap, and supporting guidance;
- `tooling/` for validation guidance and later executable tooling.

This is a floor, not a frozen ontology. The checker verifies the areas and marker but does not prescribe their internal layout, numbering, lifecycle, or document semantics. Those remain in the canonical Specifications repository until experience justifies factoring a stable rule into this skill.

The skill composes with `ki-repo` by adding only this structural delta. It does not repeat universal requirements such as README, LICENSE, `.gitignore`, GitHub configuration, or security settings.
