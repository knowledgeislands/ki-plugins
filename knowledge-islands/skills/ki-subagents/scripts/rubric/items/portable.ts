import { judgment, type RubricFamily } from '../../shared/rubric.ts'
import type { PortableContext } from '../contexts/portable.ts'

const review = (prompt: string) => judgment(prompt)
export const PORTABLE: RubricFamily<PortableContext, PortableContext> = {
  code: 'PORTABLE',
  title: 'Portable role semantics',
  description:
    'Runtime-neutral identity, instructions, lane, grounding, hand-offs, orchestration, and outcome evidence.',
  standard: 'standards-portable-subagents.md',
  selectContext: (context) => context,
  items: [
    {
      code: 'PORTABLE-1',
      title: 'Selection and identity',
      description: 'The role has stable identity and concrete selection cues without a runtime claim.',
      sources: ['standards-portable-subagents.md#required-semantic-evidence'],
      judgment: review(
        'The role has a stable identity and concrete selection cues without describing a native serialization.'
      )
    },
    {
      code: 'PORTABLE-2',
      title: 'Bounded instructions',
      description: 'Instructions state lane, grounding, and hand-offs.',
      sources: ['standards-portable-subagents.md#required-semantic-evidence'],
      judgment: review(
        'Core instructions bound the lane, require grounding before action, and name explicit hand-offs.'
      )
    },
    {
      code: 'PORTABLE-3',
      title: 'Orchestration and outcome',
      description: 'Orchestration is bounded and continued selection has outcome evidence.',
      sources: ['standards-portable-subagents.md#required-semantic-evidence'],
      judgment: review(
        'Orchestration intent is bounded and representative outcome evidence justifies selecting the role.'
      )
    }
  ]
}
