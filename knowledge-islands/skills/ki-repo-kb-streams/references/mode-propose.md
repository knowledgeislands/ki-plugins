# Mode PROPOSE — route new KB work

_On-demand procedure for Streams PROPOSE. The shared model lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Classify the request: finite forward work belongs in `Streams/Roadmap/`; a recurring obligation belongs in `Streams/Housekeeping/`; a trade is out of scope until a KB trade placement is explicitly adopted.
2. For roadmap work, use `ki-work-roadmap` to select the configured issuing area, allocate its next serial from `Streams/Roadmap/_ISSUES.md`, and propose the flat filename, path, and resulting ID. **Wait for user confirmation before creating it.**
3. For a recurring obligation, use `ki-work-housekeeping` to create or revise the template. Do not create a second generic Streams record or a Focus index.
