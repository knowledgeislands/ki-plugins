# Delegation sources

**Refresh:** external-spec · quarterly

| Source | Last reviewed | Governs |
| --- | --- | --- |
| Knowledge Islands delegation practice | 2026-08-12 | Durable high-risk handoff, authority, escalation, verification, and return boundaries |
| `ki-tokenomics` | 2026-08-12 | Model-purpose and context-cost policy belong outside the packet |
| `ki-work-roadmap` | 2026-08-12 | Approved work-record lifecycle, plan ownership, and review boundary |
| [OpenAI: Codex subagents][openai-subagents] | 2026-08-12 | Ordinary subagent task selection, permissions, and execution guidance |
| [Anthropic: Claude Code sub-agents][anthropic-subagents] | 2026-08-12 | Ordinary subagent task fit, restricted capabilities, and isolation guidance |

## Last review

The 2026-08-12 review confirmed that both vendor guides already cover ordinary task fit, isolated worker contexts, restricted capabilities, and concise results. This skill therefore retains only the durable governance delta for an approved high-risk handoff: locked decisions, scope, least authority, isolation, escalation, verification, and return evidence. It deliberately excludes vendor model names, configuration fields, task-selection heuristics, worker scheduling, concurrency limits, integration procedure, and user-interface behaviour.

Re-review quarterly or when either guide changes its delegation, isolation, permission, or background-execution semantics. Watch whether a runtime adds durable, portable authority and escalation records that make this packet redundant; until then, packets describe the needed governance boundary and executing processes choose a mechanism that can honour it.

[anthropic-subagents]: https://code.claude.com/docs/en/sub-agents
[openai-subagents]: https://learn.chatgpt.com/docs/agent-configuration/subagents
