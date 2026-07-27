import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type GateRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-enactment-process.md'

const GATE_1: RubricItem<GateRubricContext> = {
  code: 'GATE-1',
  title: 'always-loaded Enactment gate',
  description: 'A base with proposals anchors the Enactment Process and proposal gate in root CLAUDE.md or AGENTS.md.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.anchor, 'WARN') }
  }
}

const GATE_2: RubricItem<GateRubricContext> = {
  code: 'GATE-2',
  title: 'imperative gate directive',
  description: 'The anchor is imperative and states the gate exemptions.',
  sources: [SOURCE],
  judgment: { prompt: 'Is the anchor a genuine imperative directive with the appropriate exemptions?' }
}

export const GATE: RubricFamily<StreamsRubricContext, GateRubricContext> = {
  code: 'GATE',
  title: 'always-loaded gate',
  description: 'The canonical-change gate anchor.',
  standard: SOURCE,
  selectContext: (context) => context.gate,
  items: [GATE_1, GATE_2]
}
