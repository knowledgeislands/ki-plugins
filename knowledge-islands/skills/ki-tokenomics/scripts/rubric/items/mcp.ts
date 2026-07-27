import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsMcpContext, TokenomicsRubricContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const MCP_1: RubricItem<TokenomicsMcpContext> = {
  code: 'MCP-1',
  title: 'MCP servers are enumerated',
  description: 'Configured MCP servers are enumerated from the bounded user-wide Claude configuration.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.servers }
  }
}

const MCP_2: RubricItem<TokenomicsMcpContext> = {
  code: 'MCP-2',
  title: 'MCP servers are used',
  description: 'Each configured server is used by the work done in the environment.',
  sources: [SOURCE],
  judgment: { prompt: 'Is each configured server used by the work done here?' }
}

const MCP_3: RubricItem<TokenomicsMcpContext> = {
  code: 'MCP-3',
  title: 'MCP tool sets are minimal',
  description: 'Broad server tool sets are curated or dynamically discovered.',
  sources: [SOURCE],
  judgment: { prompt: 'Are broad server tool sets curated or dynamically discovered?' }
}

export const MCP: RubricFamily<TokenomicsRubricContext, TokenomicsMcpContext> = {
  code: 'MCP',
  title: 'MCP tool surface',
  description: 'MCP standing context.',
  standard: SOURCE,
  selectContext: (context) => context.mcp,
  items: [MCP_1, MCP_2, MCP_3]
}
