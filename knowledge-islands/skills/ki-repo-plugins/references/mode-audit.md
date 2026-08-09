# Mode AUDIT — inspect a plugin marketplace projection

_On-demand procedure for `ki-repo-plugins` AUDIT. The exact repository and manifest contract lives in [the plugin-marketplace standard](standards-plugin-marketplace.md)._

1. Confirm the target repository path, defaulting to the current repository.
2. Run `ki repo audit --repo <repo> --skill ki-repo-plugins`. The session inspects only physical repository paths, never follows symlinked projection or scaffold evidence, and publishes no writes or commands.
3. Apply the judgment criteria in [the rubric](rubric.md): compare the projected skill and agent set with the current harness, establish byte-for-byte reproducibility with the canonical generator, and review the repository documentation and deliberate licence exception.
4. Report generated-projection findings separately from repository-scaffold findings so each repair routes to its owner.
