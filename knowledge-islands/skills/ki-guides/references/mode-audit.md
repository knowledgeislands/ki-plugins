# Mode AUDIT — check guides

Where a guide depends on stable behaviour, follow its applicable existing Specification; otherwise record the contract gap for `ki-specs` without demanding an unrelated Specification corpus.

Read the [Guides standard](standards-guides.md) and [rubric](rubric.md) first.

1. Run `ki repo audit --skill ki-guides --repo <repo>`. It checks the guide root, collection entry point, guide H1s, retired sibling roots, and generated rubric publication.
2. Review placement and procedure quality: can the intended reader locate the guide, carry out its outcome, verify success, and recover from the failures it names?
3. Reclassify material rather than duplicating it: rationale to Decision Records, observable behaviour to Specifications, planned work to the roadmap, and practical procedure to guides.
