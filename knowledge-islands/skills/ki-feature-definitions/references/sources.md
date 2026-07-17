# Tracked sources

**Refresh:** canonical · on-change

The sources behind the [format standard](feature-format.md), the [rubric](audit-rubric.md), and [`../scripts/audit.ts`](../scripts/audit.ts). Mode REFRESH reads this file, re-examines each source, and confirms the standard still matches — then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). This is the skill's memory of where the standard comes from — keep it current.

| Source                                                                      | last reviewed |
| --------------------------------------------------------------------------- | ------------- |
| [RFC 2119 / BCP 14 — normative keyword definitions][rfc2119]                | 2026-07-09    |
| `vallearmonia-website` `docs/spec/` — the reference corpus this generalizes | 2026-07-09    |

## Notes

- **RFC 2119 (BCP 14)** is the authority for the normative keyword set (`MUST`, `MUST NOT`, `SHALL`, `SHOULD`, `SHOULD NOT`, `MAY`, `REQUIRED`, `RECOMMENDED`, `OPTIONAL`) the checker recognises and the standard mandates. It is stable; re-derive the keyword set only if BCP 14 is revised.
- **`vallearmonia-website/docs/spec/`** is the first real corpus this skill generalizes from: flat one-file-per-area, an `index.md` defining the ID scheme + areas, `### <PREFIX>-NNN — title` requirements with RFC-2119 statements and `_Verify:_` hooks, append-only IDs, and unnumbered `## Gaps` sections. It is not in the `knowledgeislands` org; sampled read-only. If it diverges from this standard, that divergence is a REFRESH signal — reconcile the standard and the corpus deliberately, not silently.

## Last review

- 2026-07-09 — Standard first authored (W4), generalized from the `vallearmonia-website` spec corpus. Keyword set anchored on RFC 2119. No open watch-items.

[rfc2119]: https://www.rfc-editor.org/rfc/rfc2119
