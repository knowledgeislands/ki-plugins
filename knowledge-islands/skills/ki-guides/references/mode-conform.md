# Mode CONFORM — bring guides into line

**Precondition:** run [AUDIT](mode-audit.md) first and retain its gap list.

1. Run `ki repo conform --skill ki-guides --repo <repo> --dry-run` to inspect any host-owned generated-publication proposal.
2. Create `docs/guides/README.md` from the exemplar if the collection is absent, then move or reclassify legacy `docs/spec/`, `docs/developer/`, and generic `docs/logs/` material deliberately. Do not delete evidence before preserving its durable conclusion in the correct source.
3. Repair missing or duplicate H1s and ensure the index gives a reader a useful route into each guide area.
4. Re-run AUDIT until mechanical findings are clean, then report the remaining judgment review.
