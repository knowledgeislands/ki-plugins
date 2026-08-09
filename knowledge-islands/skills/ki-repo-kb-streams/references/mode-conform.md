# Mode CONFORM — bring a base's Streams into line

_On-demand procedure for Streams CONFORM. The shared model lives in [`SKILL.md`](../SKILL.md) and is already loaded._

1. Run [AUDIT](mode-audit.md) first for the gap list.
2. Move records only after the base owner has classified them under the [legacy migration](standards-streams-structure.md#legacy-migration) rules. Establish `Streams/Roadmap/` and `Streams/Housekeeping/`; route their records to `ki-change-management-roadmap` and `ki-change-management-housekeeping` respectively. Do not recreate Focus folders or infer topical groups from a legacy path.
3. Confirm before moving or renaming records. The relevant owner allocates or migrates roadmap identity and its `Streams/Roadmap/_ISSUES.md` ledger; this container skill never infers, renumbers, or repairs identity.
4. Re-run [AUDIT](mode-audit.md) until clean.
