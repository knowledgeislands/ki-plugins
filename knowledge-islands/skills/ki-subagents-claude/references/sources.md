# Sources — Claude Code adapter

**Refresh:** external-spec · monthly

**Last reviewed:** 2026-08-12

The parent `ki-subagents` owns portable semantics. This adapter uses current Claude Code documentation only for native Markdown/YAML source claims. Candidate source shape does not establish publication or runtime behavior.

## Normative

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| CC | [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | Markdown/YAML source shape, required/supported fields, discovery, and runtime-only limits | 2026-08-12 |

## Local boundary

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| HOST | Harness host capability inspection recorded in the Round 25 packet | No generic subagent publisher consumes the advertised Claude path | 2026-08-12 |

## Last review

Claude Code documents Markdown/YAML source definitions and the field set listed in the standard. It also distinguishes source configuration from effective runtime behavior. The current Harness host has descriptor metadata but no implementation consuming a subagent path; this adapter therefore reports source conformance only and routes publication/activation to a future host integration.
