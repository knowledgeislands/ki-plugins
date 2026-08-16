# Sources — GitHub Issues adapter

**Refresh:** external-spec · monthly

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Issue dependencies][dependencies] | blocker relation semantics and permissions | 2026-08-12 |
| [Sub-issues][subissues] | hierarchy distinct from blockers | 2026-08-12 |
| [Issue fields][fields] | organisation-wide versus project-scoped metadata planes | 2026-08-12 |
| [Close an issue][close] | closure state and permissions | 2026-08-12 |
| [Transfer an issue][transfer] | mutable locator, redirect, retained/missing metadata | 2026-08-12 |
| [Delete an issue][delete] | permanent Issue deletion, distinct from project-item archive | 2026-08-12 |
| [Issues REST API][api] | Issue-versus-pull-request filtering and API boundary | 2026-08-12 |

## Local authority

The adapter standard is normative for KI configuration, migration stops, and no-execution boundary. GitHub documentation is primary evidence for remote capability and behaviour; it does not authorise KI process execution.

## Last review

On 2026-08-12, GitHub confirmed dependencies and sub-issues are separate relationships, issue fields and project fields are distinct metadata planes, transfers redirect old URLs while moving an open Issue, permanent Issue deletion differs from project-item archive, and REST Issues endpoints can return pull requests. The adapter therefore treats displayed references as mutable locators and remains fail-closed pending `KI-HARNESS-FND-014`.

[dependencies]: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies
[subissues]: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues
[fields]: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization
[close]: https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/closing-an-issue
[transfer]: https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/transferring-an-issue-to-another-repository
[delete]: https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/deleting-an-issue
[api]: https://docs.github.com/en/rest/issues/issues
