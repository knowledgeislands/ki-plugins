import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createStreamsSession, type StreamsRubricContext } from '../contexts/streams.ts'
import { CONFIG } from './config.ts'
import { ENACT } from './enactment.ts'
import { GATE } from './gate.ts'
import { STREAM } from './stream.ts'

export default {
  contract: 1,
  name: 'ki-kb-streams',
  concern: 'Knowledge Islands Streams zones',
  createSession: createStreamsSession,
  families: [STREAM, ENACT, GATE, CONFIG]
} satisfies SkillRubricDefinition<StreamsRubricContext>
