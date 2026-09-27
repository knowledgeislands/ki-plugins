# Tracked sources

**Refresh:** external-spec · weekly

This is the refresh ledger for the reviewed sources used by the current snapshot. Evidence identities and claim-level notes live in `radar.toml`.

| Source | Class | Governs | Last reviewed |
| ------ | ----- | ------- | ------------- |
| [Local model-radar roadmap][local-roadmap] | local | Initial route ownership and recommendation | 2026-09-26 |
| [Thoughtworks Technology Radar FAQ][thoughtworks-radar] | standard | Source ring semantics | 2026-09-26 |
| [Open Source AI Definition 1.0][osi-osaid] | standard | Open Source AI classification | 2026-09-26 |
| [BenchLM methodology][benchlm] | independent | BenchAlign aggregation and uncertainty | 2026-09-26 |
| [AA Intelligence methodology][aa-intelligence] | independent | Intelligence Index v4.3.2 | 2026-09-26 |
| [AA Coding Agent methodology][aa-coding] | independent | Coding Agent Index v1.5 | 2026-09-26 |
| [Arena-Rank methodology][arena-rank] | independent | Bradley–Terry ranking and uncertainty | 2026-09-26 |
| [Arena leaderboard policy][arena-policy] | independent | Public model and data policy | 2026-09-26 |
| [SWE-bench leaderboards][swe-bench] | independent | Current benchmark-family shape | 2026-09-26 |
| [Terminal-Bench 4.0][terminal-bench] | independent | Current terminal benchmark | 2026-09-26 |
| [Harbor core concepts][harbor] | independent | Task-environment evaluation unit | 2026-09-26 |
| [HELM repository][helm] | independent | Framework and leaderboard scope | 2026-09-26 |
| [HELM maintenance policy][helm-maintenance] | independent | Maintenance lifecycle | 2026-09-26 |
| [Claude Opus 5 launch][claude-opus] | provider | Identity, access, release | 2026-09-26 |
| [Claude Fable 5.1 model page][claude-fable] | provider | Identity, access, retention | 2026-09-26 |
| [Claude model deprecations][claude-lifecycle] | provider | Opus lifecycle | 2026-09-26 |
| [OpenAI model catalogue][openai-models] | provider | Sol and Astra identities and access | 2026-09-26 |
| [GPT-6 Astra launch][openai-astra] | provider | Astra release and availability | 2026-09-26 |
| [Gemini 3.8 Flash model page][gemini-flash] | provider | Identity, capability, stable access | 2026-09-26 |
| [Gemini model deprecations][gemini-lifecycle] | provider | Release and shutdown status | 2026-09-26 |
| [GLM-5.3 checkpoint][glm-53] | provider | Identity, weights, deployment | 2026-09-26 |
| [GLM-5.3 licence][glm-53-license] | provider | Exact weights licence | 2026-09-26 |
| [GLM-5.3-Flash release][glm-53-flash] | provider | Identity, scale, deployment | 2026-09-26 |
| [GLM-5.3-Flash licence][glm-53-flash-license] | provider | Exact weights licence | 2026-09-26 |
| [Kimi K3 repository][kimi-k3] | provider | Identity, weights, access | 2026-09-26 |
| [Kimi K3 licence][kimi-k3-license] | provider | Exact weights licence | 2026-09-26 |
| [Qwen3.8 Max model page][qwen-max] | provider | Exact hosted Max identity | 2026-09-26 |
| [Qwen3.8 repository][qwen-family] | provider | Open-model family boundary | 2026-09-26 |
| [Qwen3.8-27B checkpoint][qwen-27b] | provider | Workstation-lane weights and licence | 2026-09-26 |
| [Grok 4.6 launch][grok-launch] | provider | Identity, release, hosted routes | 2026-09-26 |
| [Grok 4.6 model page][grok-model] | provider | API identity and current access | 2026-09-26 |

## Last review

- 2026-09-14 — Replaced the placeholder with individually reviewed primary methodology, benchmark-owner, provider, licence, lifecycle, and local-owner sources.
- 2026-09-17 — Rechecked current provider lifecycle pages and benchmark-owner return triggers. Sol, Astra, Opus 5, and Gemini 3.8 Flash remain active; BenchLM v5.5, Coding Agent Index v1.5, SWE-bench, Terminal-Bench 4.0, and HELM maintenance state did not justify recommendation or lifecycle movement.
- 2026-09-26 — Rechecked every tracked source. Existing model identities remain active, Artificial Analysis advanced to Intelligence Index v4.3.2, and no existing recommendation moved. New model candidates and local route implications were routed to `KI-HARNESS-GOV-112` for bounded evaluation.
- The KI recommendation vocabulary is a documented local adaptation of Thoughtworks' four rings: it preserves Adopt, Trial, Assess, and Caution as Hold rather than claiming an exact reproduction.
- HELM entered maintenance mode on 2026-06-01 and remains watch-level corroborating evidence, not a current frontier-primary source.
- All named initial model identities were substantiated. Hosted-only variants retain a conservative proprietary distribution classification; no public weights licence was found for those exact variants.
- Open watch-item: reassess provider availability, retirement notices, pricing, route support, benchmark versions, and data dates during every weekly refresh.
- Open watch-item: do not promote an open-weight model to Open Source AI Definition conformance without evidence for the definition's data-information, code, and parameter requirements.
- Open watch-item: keep hosted `qwen3.8-max` separate from Apache-2.0 Qwen3.8 open-weight checkpoints.

[aa-coding]: https://artificialanalysis.ai/methodology/coding-agents-benchmarking/
[aa-intelligence]: https://artificialanalysis.ai/methodology/intelligence-benchmarking
[arena-policy]: https://arena.ai/blog/policy
[arena-rank]: https://arena.ai/blog/arena-rank
[benchlm]: https://benchlm.ai/methodology
[claude-fable]: https://www.anthropic.com/claude/fable
[claude-lifecycle]: https://docs.anthropic.com/en/docs/about-claude/model-deprecations
[claude-opus]: https://www.anthropic.com/news/claude-opus-5
[gemini-flash]: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash
[gemini-lifecycle]: https://ai.google.dev/gemini-api/docs/deprecations
[glm-53-flash-license]: https://huggingface.co/zai-org/GLM-5.3-Flash/blob/main/LICENSE
[glm-53-flash]: https://autoclaw.z.ai/blog/model/glm-5.3-flash/
[glm-53-license]: https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
[glm-53]: https://huggingface.co/zai-org/GLM-5.3
[grok-launch]: https://x.ai/news/grok-4-6
[grok-model]: https://docs.x.ai/developers/models/grok-4.6
[harbor]: https://www.harborframework.com/docs/core-concepts
[helm-maintenance]: https://github.com/stanford-crfm/helm/blob/main/docs/maintenance_mode.md
[helm]: https://github.com/stanford-crfm/helm
[kimi-k3]: https://github.com/MoonshotAI/Kimi-K3

[kimi-k3-license]: https://github.com/MoonshotAI/Kimi-K3/blob/main/LICENSE
[local-roadmap]: https://github.com/knowledgeislands/ki-agentic-harness/blob/dd45807722a06cf3e54686f4eaa38c1149836e3a/docs/roadmap/KI-HARNESS-REV-003-establish-model-radar.md
[openai-astra]: https://openai.com/index/gpt-6-astra/
[openai-models]: https://developers.openai.com/api/docs/models
[osi-osaid]: https://opensource.org/ai/open-source-ai-definition
[qwen-27b]: https://huggingface.co/Qwen/Qwen3.8-27B
[qwen-family]: https://github.com/QwenLM/Qwen3.8
[qwen-max]: https://docs.modelstudio.console.alibabacloud.com/en/model-studio/qwen3-8-max
[swe-bench]: https://www.swebench.com/
[terminal-bench]: https://www.tbench.ai/
[thoughtworks-radar]: https://www.thoughtworks.com/radar/faq
