import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type GateRubricContext, type StreamsRubricContext } from '../contexts/streams.ts'

const SOURCE = 'standards-enactment-process.md'

const GATE_1: RubricItem<GateRubricContext> = {
  code: 'GATE-1',
  title: 'always-loaded change-management gate',
  description: 'A base with governed work anchors its canonical-change routing in root CLAUDE.md or AGENTS.md.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Add the appropriate canonical change-management anchor only after confirming the base carries governed work and the always-loaded instruction surface.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.anchor, 'WARN') }
  }
}

const GATE_2: RubricItem<GateRubricContext> = {
  code: 'GATE-2',
  title: 'imperative gate directive',
  description: 'The anchor is imperative and routes canonical changes through the relevant adapter.',
  sources: [SOURCE],
  judgment: {
    scope: 'The always-loaded gate anchor and its stated exceptions.',
    prompt: 'Is the anchor a genuine imperative directive with the appropriate exemptions?',
    outcomes: ['conforming', 'directive revision required', 'exception decision required'],
    guidance: 'Rewrite the anchor as a clear imperative directive and document only the process-approved exemptions.'
  }
}

export const GATE: RubricFamily<StreamsRubricContext, GateRubricContext> = {
  code: 'GATE',
  title: 'always-loaded gate',
  description: 'The canonical-change gate anchor.',
  standard: SOURCE,
  selectContext: (context) => context.gate,
  items: [GATE_1, GATE_2]
}
