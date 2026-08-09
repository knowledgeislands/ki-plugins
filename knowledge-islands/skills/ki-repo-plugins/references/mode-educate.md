# Mode EDUCATE — establish a marketplace repository

_On-demand procedure for `ki-repo-plugins` EDUCATE._

1. Run `ki repo educate --skill ki-repo-plugins` to declare the repository's `[skills.ki-repo-plugins]` marker.
2. Establish the repository-owned scaffold: `LICENSE`, `README.md`, `.gitignore`, `.editorconfig`, and a `CLAUDE.md` that states the generated-not-hand-edited invariant. Use `ki-repo` for the wider repository and GitHub contract.
3. From the harness, run `bun skills/environment/ki-binding-claude/scripts/build-plugin.ts <repo>` to generate `.claude-plugin/` and `knowledge-islands/`; do not author them manually.
4. Use `ki-binding-claude` to enable the Cowork surface, then run [AUDIT](mode-audit.md).
