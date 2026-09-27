# Sources — Claude Code adapter

**Refresh:** external-spec · monthly

**Last reviewed:** 2026-09-26

The parent `ki-subagents` owns portable semantics. This adapter uses current Claude Code documentation only for native Markdown/YAML source claims. Candidate source shape does not establish publication or runtime behavior.

## Normative

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| CC | [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) | Markdown/YAML source shape, required/supported fields, discovery, and runtime-only limits | 2026-09-26 |

## Local boundary

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| HOST | Current repository and KI host capability inspection | No generic subagent publisher consumes the advertised Claude path | 2026-09-26 |

## Last review

On 2026-09-26, Claude Code still documented Markdown/YAML source definitions with the field set listed in the standard and distinguished source configuration from effective runtime behaviour. The current KI host has descriptor metadata but no generic implementation consuming a subagent path; this adapter therefore continues to report source conformance only and routes publication or activation to future host integration.
