# README composition conventions

These judgment-layer conventions govern how a Knowledge Islands README helps a reader orient and act. They draw selectively on [Standard Readme][sr], an advisory specification designed primarily for open-source libraries. The local convention owns the interpretation; differences from that source are not audit findings.

## Reader-first entry point

A README should establish the repository’s name, purpose, intended audience, and current status before asking the reader to navigate elsewhere. Prefer one concrete opening description over slogans, badges, or a history lesson.

Give the reader the shortest useful next route. Depending on repository purpose, that may be installation, usage, local development, the main knowledge index, capability catalogue, or operating guide. Do not make a reader infer the primary action from a directory tree.

## Proportional structure

Include a section only when the repository’s purpose creates that reader need. Installation and usage are valuable for executable tools, but may be irrelevant to a documentation-only repository. Contribution, security, maintenance, and licence information should be easy to find where those concerns apply, without forcing every README into one template.

Use a table of contents only when it materially reduces navigation cost. Prefer descriptive links to durable guides or specifications over duplicating their detail into an ever-growing README.

## Credible examples

Show the smallest realistic example that proves the advertised route works. Keep commands copyable, name prerequisites that are not obvious, and link to deeper guidance once the reader has enough context to choose it.

Examples are evidence, not decoration. Remove stale examples or update them with the contract they illustrate; do not preserve a large tutorial in the README when a maintained guide owns that workflow.

## Ownership boundaries

`ki-authoring` owns generic README composition, readability, proportional navigation, and progressive disclosure.

`ki-repo` owns whether a repository must have a README plus its baseline identity, purpose, and metadata expectations. Repository-kind skills own specialized content their structures require. `ki-skills` owns `SKILL.md`; a skill README does not replace its portable entry point.

## Deliberate exclusions

Do not adopt Standard Readme’s fixed section names or order, mandatory library install and usage sections, badge convention, 100-line navigation threshold, or licence-last rule as universal Knowledge Islands policy.

Do not optimize a README for template compliance at the expense of repository purpose. The test is whether the intended reader can identify the repository, understand why it exists, and reach the next useful action quickly.

[sr]: https://github.com/RichardLitt/standard-readme
