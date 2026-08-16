# Tracked sources

**Refresh:** canonical · on-change

The sources behind the [Specifications standard](standards-specs.md) and [rubric](rubric.md). Mode REFRESH re-examines each source, confirms the standard still matches, bumps the `last reviewed` dates, and refreshes the Last review block. The commit records what changed.

| Source                                                                      | last reviewed |
| --------------------------------------------------------------------------- | ------------- |
| [RFC 2119 — original normative keyword definitions][rfc2119]                 | 2026-08-12    |
| [RFC 8174 — BCP 14 uppercase clarification][rfc8174]                         | 2026-08-12    |
| Local sampled reference corpus — supporting discovery, not normative authority | 2026-08-12  |

## Notes

- **RFC 2119 plus RFC 8174 are BCP 14.** RFC 8174 updates the original terminology with the uppercase-only interpretation and adds `NOT RECOMMENDED`; the checker and standard use this pair as their portable primary authority.
- The initial `vallearmonia-website/docs/specs/` sample has no reproducible immutable locator in this source record. It remains supporting discovery only and cannot establish the house layout, serial, or verification contract. Reintroduce it as a reproducible source only with a stable URL and sampled revision.

## Last review

- 2026-08-12 — Refreshed the BCP 14 authority pair. RFC 8174 confirms uppercase-only interpretation and `NOT RECOMMENDED`; the local standard and checker now name the pair. Demoted the unpinned reference corpus to supporting discovery. Serial scope and applicability remain owner-gated policy questions, not source-derived mechanics.

[rfc2119]: https://www.rfc-editor.org/rfc/rfc2119
[rfc8174]: https://www.rfc-editor.org/rfc/rfc8174
