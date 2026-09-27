# Tracked sources

**Refresh:** external-spec · weekly

This ledger records the primary and corroborating sources accepted into the agentic radar. Evidence identities and claim-level notes live in `radar.toml`; inclusion here does not by itself establish maturity, implementation, interoperability, or adoption.

## Identity, specification, and governance

- **Model Context Protocol (MCP):** the [2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28/basic) is the normative protocol text; the [Agentic AI Foundation transfer announcement](https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/) establishes current governance; and the [SDK tier policy](https://modelcontextprotocol.io/community/sdk-tiers) defines scenario-based conformance expectations.
- **Agent Client Protocol (ACP):** the [version 1 protocol overview](https://agentclientprotocol.com/protocol/v1/overview), stable [schema v1.23.0 release](https://github.com/agentclientprotocol/agent-client-protocol/releases/tag/schema-v1.23.0), and [governance page](https://agentclientprotocol.com/community/governance) define the stable wire contract and interim joint stewardship by Zed and JetBrains. The separately published [v2.0.0 alpha 5 schema](https://github.com/agentclientprotocol/agent-client-protocol/releases/tag/schema-v2.0.0-alpha.5) is pre-stable counter-evidence, not a replacement for protocolVersion 1.
- **Agent Host Protocol (AHP):** the [specification overview](https://microsoft.github.io/agent-host-protocol/specification/overview.html), [0.9.0 release](https://github.com/microsoft/agent-host-protocol/releases/tag/spec%2Fv0.9.0), and [versioning policy](https://microsoft.github.io/agent-host-protocol/specification/versioning) establish a versioned pre-1.0 Microsoft protocol with channel-specific stability.
- **Agent2Agent Protocol (A2A):** the [latest specification](https://a2a-protocol.org/latest/specification/) and [v1.0.1 release](https://github.com/a2aproject/A2A/releases/tag/v1.0.1) establish the current Linux Foundation protocol release.
- **AGENTS.md:** the [format site](https://agents.md/) describes the unversioned repository instruction format; the [Agentic AI Foundation announcement](https://openai.com/index/agentic-ai-foundation/) records its transfer to foundation governance.
- **W3C AI Agent Protocol Community Group:** the [Community Group page](https://www.w3.org/community/agentprotocol/) identifies the incubating group and its draft report; the [living protocol draft](https://w3c-cg.github.io/ai-agent-protocol/protocol.html) is exploratory Community Group work, not a W3C Recommendation.

> [!IMPORTANT]
> In this ledger, **ACP** means the Agent Client Protocol stewarded by Zed and JetBrains. It does not mean IBM's Agent Communication Protocol or AGNTCY's Agent Connect Protocol.

## Independent implementation and local evidence

- **MCP:** [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/guides/mcp/) and [Cloudflare Agents](https://developers.cloudflare.com/agents/model-context-protocol/) provide independent implementations. The local [ki-binding capability](https://github.com/knowledgeislands/ki-agentic-harness/tree/main/skills/governance/ki-binding) supplies bounded Knowledge Islands adoption evidence.
- **ACP:** [Gemini CLI's ACP adapter](https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/acp/README.md) and [CodeCompanion's ACP client](https://github.com/olimorris/codecompanion.nvim/blob/main/doc/codecompanion.txt) are independent implementations. Their [documented integration result](https://github.com/olimorris/codecompanion.nvim/discussions/2030) is bounded interoperability evidence. The ACP introduction still marks [full remote-agent support as work in progress](https://agentclientprotocol.com/get-started/introduction).
- **AHP:** the official [implementation catalogue](https://microsoft.github.io/agent-host-protocol/guide/implementations.html) lists Microsoft-project clients and reference surfaces plus the independent [pi-ahp](https://github.com/Qusic/pi-ahp) and [ahpd](https://github.com/softov/ahpd) hosts. Wyrd Company's independent [AHP server](https://github.com/wyrd-company/ahp-server) implements a bounded server surface and publishes compatibility tests against Microsoft's TypeScript client. That establishes multiple independent implementations, not an independently witnessed interoperability result.
- **A2A:** [Google ADK](https://github.com/google/adk-docs/blob/main/docs/a2a/index.md) and [BeeAI Framework](https://github.com/i-am-bee/beeai-framework) provide independent implementations. The official [A2A technology compatibility kit](https://github.com/a2aproject/a2a-tck) covers the protocol bindings, but no reviewed public pass or certification matrix was found.
- **AGENTS.md:** [OpenAI Codex](https://openai.com/index/introducing-codex/) and [Visual Studio Code](https://code.visualstudio.com/docs/agent-customization/custom-instructions) implement the format independently. The format site reports broad operational adoption, while VS Code describes nested `AGENTS.md` support as experimental. This repository's [AGENTS.md](https://github.com/knowledgeislands/ki-agentic-harness/blob/main/AGENTS.md) is the local adoption evidence.
- **W3C AI Agent Protocol Community Group:** no reviewed implementation, conformance result, or interoperability demonstration was found in the group's primary publications.

## Agent coordination tooling

- **Gas City:** the [open-source orchestrator](https://github.com/gastownhall/gascity) supplies reference-implementation evidence; the [software-factory guide](https://gascity.com/guide/ai-software-factory/) describes Beads-backed durable work, configured coding workflows, routing, retries, and review gates.
- **Paperclip:** the [open-source control plane](https://github.com/PaperclipAI/paperclip) supplies reference-implementation evidence; the [key concepts guide](https://docs.paperclip.ing/guides/welcome/key-concepts/) describes company boundaries, hierarchical agent roles, tasks, goals, budgets, and approvals.

These sources establish two implemented coordination tools with overlapping multi-agent concerns but different primary abstractions. They do not establish comparative fitness, cross-tool interoperability, or a Knowledge Islands adoption decision.

## Agent-owned browser runtimes

- **Obscura:** the [open-source implementation](https://github.com/h4ckf0r0day/obscura) documents a self-hosted Rust browser engine with CDP, Playwright, Puppeteer, rendering, storage, and MCP surfaces. The [product description](https://obscura.sh/#how) emphasises isolated zero-state sessions; that supports isolation while leaving authenticated-profile provisioning and recurring ChatGPT fidelity for local evaluation.

## Structural vocabulary evidence

These sources bound recurring architecture terms without treating them as protocols or comparable standards in the radar snapshot.

- **Agent loop:** the [OpenAI Agents SDK run loop](https://openai.github.io/openai-agents-js/guides/running-agents/) repeatedly invokes a model, interprets a final output, handoff, or tool call, and stops on final output or a bounded turn limit.
- **Supervisor or branching tree:** the [OpenAI multi-agent guide](https://openai.github.io/openai-agents-js/guides/multi-agent/) and Anthropic's [multi-agent research system account](https://www.anthropic.com/engineering/multi-agent-research-system) describe a coordinating agent retaining responsibility while delegating bounded work, often in parallel, to specialists. A concrete system can include retries or shared workers and therefore need not be a literal tree.
- **Graph-orchestrated execution:** the [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) models executable shared state with nodes and edges, including cycles, conditional branches, joins, and parallel fan-out.
- **Knowledge graph:** [RDF 1.1 Concepts](https://www.w3.org/TR/rdf11-concepts/) supplies a stable graph data model of subject-predicate-object triples. The broader term "knowledge graph" is not necessarily RDF and does not imply an execution engine.
- **Provenance graph:** the W3C [PROV data model](https://www.w3.org/TR/prov-dm/) and [PROV-O ontology](https://www.w3.org/TR/prov-o/) model entities, activities, agents, derivation, use, generation, attribution, and responsibility. Provenance records lineage; it is not itself workflow execution or domain knowledge.

## Last review

| Review | Outcome | Last reviewed |
  | ------ | ------- | ------------- |
| Initial evidence set | Six subjects and structural vocabulary reviewed. | 2026-09-14 |
| Weekly review | ACP schema releases and AHP release plus independent implementation accepted; other subject stances unchanged. | 2026-09-17 |
| Browser-runtime signal | Added agent-owned isolated browser runtimes for assessment, with Obscura as reference implementation and a bounded local trial required before adoption. | 2026-09-22 |
| Weekly review | ACP advanced to stable schema v1.23.0 and v2 alpha 5; AHP now has multiple independent hosts, while interoperability remains untested; other stances remain unchanged. | 2026-09-26 |
| Coordination-tooling signal | Added Gas City and Paperclip as new assessment subjects, preserving the workflow-factory versus company-control-plane distinction without adoption inference. | 2026-09-26 |

- Return triggers: new protocol release, governance transfer, independent implementation, published conformance result, cross-implementation demonstration, deprecation, or a Knowledge Islands use case requiring reassessment.
- Agent Client Protocol is disambiguated from similarly named IBM and AGNTCY protocols; structural vocabulary remains outside the subject registry where the schema would misclassify it.
- Open watch item: seek public cross-implementation conformance or interoperability results for AHP, A2A, and AGENTS.md rather than inferring them from package or implementation counts.
