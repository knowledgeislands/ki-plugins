import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createStreamsSession, type StreamsRubricContext } from '../contexts/streams.ts'
import { CONFIG } from './config.ts'
import { GATE } from './gate.ts'
import { RUBRIC } from './publication.ts'
import { STREAM } from './stream.ts'

export default {
  contract: 1,
  name: 'ki-repo-kb-streams',
  concern: 'Knowledge Islands Streams zones',
  createSession: createStreamsSession,
  families: [RUBRIC, STREAM, GATE, CONFIG]
} satisfies SkillRubricDefinition<StreamsRubricContext>
