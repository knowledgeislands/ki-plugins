import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import {
  type ActivitiesContext,
  type ActivitiesRubricContext,
  type ActivityNote,
  markdownLinkTargets
} from '../contexts/activities.ts'

const SOURCE = 'standards-activities.md'
const KNOWN_REALIZATIONS = ['slash-command', 'scheduled-task', 'conversational', 'manual', 'workflow'] as const
const KNOWN_STATUSES = ['active', 'paused', 'retired'] as const

const unavailable = (context: ActivitiesContext): RubricOutcomes<AuditOutcome> | null =>
  !context.repository.available
    ? [{ status: 'VIOLATION', message: 'audit target is not an existing directory', subject: context.repository.path }]
    : !context.collection.pathSafe || context.collection.unsafeEntry
      ? [{ status: 'NOT_APPLICABLE', message: 'activity collection location is unsafe; ACT-S-2 owns this finding' }]
      : !context.collection.available
        ? [
            {
              status: 'NOT_APPLICABLE',
              message: 'no activities directory — nothing to audit',
              subject: `${context.collection.relative}/`
            }
          ]
        : null

const notesWithFrontmatter = (context: ActivitiesContext): readonly ActivityNote[] =>
  context.notes.filter((note) => note.frontmatter !== null)

const oneOrMore = <Outcome>(values: readonly Outcome[]): RubricOutcomes<Outcome> => {
  if (values.length === 0) throw new Error('expected one or more rubric outcomes')
  return [values[0], ...values.slice(1)]
}

const ACT_S_1: RubricItem<ActivitiesContext> = {
  code: 'ACT-S-1',
  title: 'activity index',
  description: '`Activities.md` exists when one or more activity notes exist and lists every note.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        if (context.notes.length === 0)
          return [{ status: 'NOT_APPLICABLE', message: 'no activity notes found — index check not applicable' }]
        if (context.index.unsafeEntry)
          return [
            {
              status: 'VIOLATION',
              message: 'index path is not a regular file and cannot be inspected safely',
              subject: context.index.relative
            }
          ]
        if (!context.index.content)
          return [
            {
              status: 'VIOLATION',
              message: 'index is absent — create an index listing all activities',
              subject: context.index.relative
            }
          ]
        const targets = markdownLinkTargets(context.index.content)
        const missing = context.notes.filter((note) => !targets.has(note.indexLink))
        return missing.length
          ? oneOrMore(
              missing.map((note) => ({
                status: 'VIOLATION' as const,
                message: `activity note is absent from the index: ${note.indexLink}`,
                subject: context.index.relative
              }))
            )
          : [
              {
                status: 'PASS',
                message: `index lists all ${context.notes.length} activity note(s)`,
                subject: context.index.relative
              }
            ]
      }
    },
    conform: {
      phase: 'DERIVED',
      run: (context) => {
        context.ensureIndex?.()
      }
    }
  },
  judgment: {
    scope: 'The Activities index, its note entries, ordering, and reader-facing descriptions.',
    prompt: 'Is the index current, well ordered, and informative rather than merely mechanically complete?',
    outcomes: ['conforming', 'index revision required', 'index structure decision required'],
    guidance:
      'Revise the index ordering or descriptions so a reader can understand and navigate the active activity set; record a structure decision for a material reorganisation.'
  }
}

const ACT_S_2: RubricItem<ActivitiesContext> = {
  code: 'ACT-S-2',
  title: 'activity collection location',
  description: 'The configured activity collection resolves safely beneath an existing base.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct activities_dir so it resolves safely beneath the selected base, or repair the unsafe collection entry without following links.'
    },
    audit: {
      phase: 'PREPARE',
      run: (context) => {
        if (!context.repository.available)
          return [
            {
              status: 'VIOLATION',
              message: 'audit target is not an existing directory',
              subject: context.repository.path
            }
          ]
        if (!context.collection.pathSafe)
          return [
            {
              status: 'VIOLATION',
              message: 'activities_dir must resolve beneath the base',
              subject: context.collection.relative
            }
          ]
        if (context.collection.unsafeEntry)
          return [
            {
              status: 'VIOLATION',
              message: 'activity collection path is not a real directory',
              subject: context.collection.relative
            }
          ]
        return [
          {
            status: 'PASS',
            message: 'activity collection location resolves safely beneath the base',
            subject: context.collection.relative
          }
        ]
      }
    }
  }
}

const ACT_S_3: RubricItem<ActivitiesContext> = {
  code: 'ACT-S-3',
  title: 'known Activity configuration',
  description: 'Only activities_dir and harness are recognized under [skills.ki-repo-kb-activities].',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Remove or document unsupported configuration keys after confirming the activity collection contract they were intended to express.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const unknown = context.configuration.keys.filter((key) => !['activities_dir', 'harness'].includes(key))
        return unknown.length
          ? [
              {
                status: 'VIOLATION',
                message: `unrecognized [skills.ki-repo-kb-activities] key(s): ${unknown.join(', ')}`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'PASS',
                message: 'only recognized [skills.ki-repo-kb-activities] keys are present',
                subject: '.ki-config.toml'
              }
            ]
      }
    }
  }
}

const ACT_F_1: RubricItem<ActivitiesContext> = {
  code: 'ACT-F-1',
  title: 'activity status',
  description: 'Frontmatter-bearing activity notes declare `status` as `active`, `paused`, or `retired`.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add a valid activity status that reflects the activity’s actual lifecycle state.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const outcomes: AuditOutcome[] = []
        for (const note of context.notes) {
          if (note.malformedFrontmatter)
            outcomes.push({
              status: 'VIOLATION',
              message: 'frontmatter is malformed and cannot be validated safely',
              subject: note.relative
            })
          else if (!note.frontmatter)
            outcomes.push({
              status: 'INFO',
              message: 'no frontmatter block — judgment check only',
              subject: note.relative
            })
          else if (!note.frontmatter.status)
            outcomes.push({
              status: 'VIOLATION',
              message: "missing required field 'status' (active | paused | retired)",
              subject: note.relative
            })
          else if (!KNOWN_STATUSES.includes(note.frontmatter.status as (typeof KNOWN_STATUSES)[number]))
            outcomes.push({
              status: 'VIOLATION',
              message: `status '${note.frontmatter.status}' is not one of active / paused / retired`,
              subject: note.relative
            })
          else
            outcomes.push({
              status: 'PASS',
              message: `status '${note.frontmatter.status}' is valid`,
              subject: note.relative
            })
        }
        return outcomes.length
          ? oneOrMore(outcomes)
          : [{ status: 'NOT_APPLICABLE', message: 'no activity notes found' }]
      }
    }
  }
}

const ACT_F_2: RubricItem<ActivitiesContext> = {
  code: 'ACT-F-2',
  title: 'activity realization',
  description: 'Frontmatter-bearing activity notes declare a `realization`.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the activity realization that accurately describes how the activity is invoked or operated.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const outcomes: AuditOutcome[] = []
        for (const note of notesWithFrontmatter(context))
          outcomes.push(
            note.frontmatter?.realization
              ? {
                  status: 'PASS',
                  message: `realization '${note.frontmatter.realization}' declared`,
                  subject: note.relative
                }
              : { status: 'VIOLATION', message: "missing required field 'realization'", subject: note.relative }
          )
        return outcomes.length
          ? oneOrMore(outcomes)
          : [{ status: 'NOT_APPLICABLE', message: 'no frontmatter-bearing activity notes found' }]
      }
    }
  }
}

const ACT_F_3: RubricItem<ActivitiesContext> = {
  code: 'ACT-F-3',
  title: 'recognized realization',
  description: 'Unknown realization values are surfaced for environment documentation without blocking extension.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Document an unknown realization in the agentic environment or select a known realization only when it accurately describes the activity.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const outcomes = notesWithFrontmatter(context)
          .filter((note) => note.frontmatter?.realization)
          .map((note) =>
            KNOWN_REALIZATIONS.includes(note.frontmatter?.realization as (typeof KNOWN_REALIZATIONS)[number])
              ? {
                  status: 'PASS' as const,
                  message: `realization '${note.frontmatter?.realization}' is known`,
                  subject: note.relative
                }
              : {
                  status: 'INFO' as const,
                  message: `realization '${note.frontmatter?.realization}' is not in the known list — ensure the agentic environment is documented`,
                  subject: note.relative
                }
          )
        return outcomes.length
          ? oneOrMore(outcomes)
          : [{ status: 'NOT_APPLICABLE', message: 'no realized activity notes found' }]
      }
    }
  }
}

const ACT_F_4: RubricItem<ActivitiesContext> = {
  code: 'ACT-F-4',
  title: 'activity author',
  description: 'Frontmatter-bearing activity notes declare who authored or adopted the activity.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the person or agent that authored or adopted the activity according to its actual provenance.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const outcomes = notesWithFrontmatter(context).map((note) =>
          note.frontmatter?.author
            ? {
                status: 'PASS' as const,
                message: `author '${note.frontmatter.author}' declared`,
                subject: note.relative
              }
            : { status: 'VIOLATION' as const, message: "missing required field 'author'", subject: note.relative }
        )
        return outcomes.length
          ? oneOrMore(outcomes)
          : [{ status: 'NOT_APPLICABLE', message: 'no frontmatter-bearing activity notes found' }]
      }
    }
  }
}

const ACT_R_1: RubricItem<ActivitiesContext> = {
  code: 'ACT-R-1',
  title: 'slash-command skill field',
  description: 'A `slash-command` activity declares its `skill` field.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Declare the owning SKILL.md for the slash-command activity after confirming the command’s intended capability.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const notes = notesWithFrontmatter(context).filter((note) => note.frontmatter?.realization === 'slash-command')
        if (notes.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'no slash-command activities found' }]
        return oneOrMore(
          notes.map((note) =>
            note.frontmatter?.skill
              ? {
                  status: 'PASS' as const,
                  message: `skill '${note.frontmatter.skill}' declared`,
                  subject: note.relative
                }
              : {
                  status: 'VIOLATION' as const,
                  message: "slash-command requires a 'skill' field naming the SKILL.md",
                  subject: note.relative
                }
          )
        )
      }
    }
  }
}

const ACT_R_2: RubricItem<ActivitiesContext> = {
  code: 'ACT-R-2',
  title: 'slash-command skill resolution',
  description: 'A declared slash-command skill resolves when a harness path is supplied.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the declared skill or configure the intended harness path; do not infer a substitute capability automatically.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const notes = notesWithFrontmatter(context).filter(
          (note) => note.frontmatter?.realization === 'slash-command' && note.frontmatter.skill
        )
        if (notes.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'no declared slash-command skills found' }]
        if (!context.harness)
          return oneOrMore(
            notes.map((note) => ({
              status: 'INFO' as const,
              message: `skill '${note.frontmatter?.skill}' declared but no harness path is configured under [skills.ki-repo-kb-activities]`,
              subject: note.relative
            }))
          )
        return oneOrMore(
          notes.map((note) =>
            context.harness?.hasSkill(note.frontmatter?.skill ?? '')
              ? {
                  status: 'PASS' as const,
                  message: `skill '${note.frontmatter?.skill}' exists in the harness`,
                  subject: note.relative
                }
              : {
                  status: 'VIOLATION' as const,
                  message: `skill '${note.frontmatter?.skill}' is absent from the harness`,
                  subject: note.relative
                }
          )
        )
      }
    }
  }
}

const ACT_R_3: RubricItem<ActivitiesContext> = {
  code: 'ACT-R-3',
  title: 'scheduled-task name',
  description: 'A `scheduled-task` activity declares its `schedule_name`.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the external scheduler’s actual task name for the scheduled activity.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const notes = notesWithFrontmatter(context).filter((note) => note.frontmatter?.realization === 'scheduled-task')
        if (notes.length === 0) return [{ status: 'NOT_APPLICABLE', message: 'no scheduled-task activities found' }]
        return oneOrMore(
          notes.map((note) =>
            note.frontmatter?.schedule_name
              ? {
                  status: 'PASS' as const,
                  message: `schedule '${note.frontmatter.schedule_name}' declared`,
                  subject: note.relative
                }
              : {
                  status: 'VIOLATION' as const,
                  message: "scheduled-task requires a 'schedule_name' field",
                  subject: note.relative
                }
          )
        )
      }
    }
  }
}

const ACT_R_4: RubricItem<ActivitiesContext> = {
  code: 'ACT-R-4',
  title: 'scheduled-task registration',
  description: 'Scheduled-task registrations are surfaced for verification in their external environment.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Verify the named task in its external scheduler and update the activity note or scheduler registration through the owning environment.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const stop = unavailable(context)
        if (stop) return stop
        const notes = notesWithFrontmatter(context).filter(
          (note) => note.frontmatter?.realization === 'scheduled-task' && note.frontmatter.schedule_name
        )
        if (notes.length === 0)
          return [{ status: 'NOT_APPLICABLE', message: 'no named scheduled-task activities found' }]
        return oneOrMore(
          notes.map((note) => ({
            status: 'INFO' as const,
            message: `verify '${note.frontmatter?.schedule_name}' is registered and active in ${note.frontmatter?.schedule_env ?? 'the external scheduling system'}`,
            subject: note.relative
          }))
        )
      }
    }
  }
}

const ACT_J_1: RubricItem<ActivitiesContext> = {
  code: 'ACT-J-1',
  title: 'activity note clarity',
  description: 'Each activity note body explains what the activity does, when it runs, and why it was adopted.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every activity note body and its stated purpose, trigger, and adoption rationale.',
    prompt: 'Does each activity note clearly explain what it does, when it runs, and why it was adopted?',
    outcomes: ['conforming', 'narrative revision required', 'rationale required'],
    guidance:
      'Add a concise explanation of behaviour, trigger or cadence, and adoption rationale while retaining the note’s operational focus.'
  }
}

const ACT_J_2: RubricItem<ActivitiesContext> = {
  code: 'ACT-J-2',
  title: 'activity index quality',
  description: 'The activity index is current, ordered, and useful to a reader.',
  sources: [SOURCE],
  judgment: {
    scope: 'The Activities index and its ordering, descriptions, and current activity coverage.',
    prompt: 'Is the activity index current, ordered, and useful rather than just mechanically complete?',
    outcomes: ['conforming', 'index revision required', 'organisation decision required'],
    guidance:
      'Revise ordering and descriptions to aid a reader, or record the organisation decision that explains a non-obvious index structure.'
  }
}

const ACT_J_3: RubricItem<ActivitiesContext> = {
  code: 'ACT-J-3',
  title: 'retirement rationale',
  description: 'Retired activities document why they were retired rather than disappearing silently.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every retired activity note and its lifecycle history.',
    prompt: 'Do retired activities document a clear retirement rationale?',
    outcomes: ['conforming', 'rationale required', 'status correction required'],
    guidance:
      'Record why the activity was retired and the relevant replacement or cessation context, or correct a status that does not reflect retirement.'
  }
}

const ACT_J_4: RubricItem<ActivitiesContext> = {
  code: 'ACT-J-4',
  title: 'slash-command documentation',
  description: 'Slash-command activities link to their skill documentation or trigger description.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every slash-command activity and its linked skill documentation or trigger guidance.',
    prompt: 'Does every slash-command activity link to useful skill documentation or trigger guidance?',
    outcomes: ['conforming', 'documentation link required', 'trigger guidance required'],
    guidance:
      'Link the activity to its authoritative skill documentation or add clear trigger guidance that explains how it is invoked.'
  }
}

const ACT_J_5: RubricItem<ActivitiesContext> = {
  code: 'ACT-J-5',
  title: 'scheduled-task narrative',
  description: 'Scheduled-task activities document cadence and expected outcome.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every scheduled-task activity note, its cadence, and expected outcome.',
    prompt: 'Does every scheduled-task note state its cadence and expected outcome?',
    outcomes: ['conforming', 'cadence required', 'outcome required'],
    guidance:
      'State the scheduler cadence and the expected observable outcome so operators can distinguish normal execution from drift.'
  }
}

export const ACT: RubricFamily<ActivitiesRubricContext, ActivitiesContext> = {
  code: 'ACT',
  title: 'knowledge-base activities',
  description: 'Activity note structure, frontmatter, realization-specific declarations, and safe index maintenance.',
  standard: SOURCE,
  selectContext: (context) => context.activities,
  items: [
    ACT_S_1,
    ACT_S_2,
    ACT_S_3,
    ACT_F_1,
    ACT_F_2,
    ACT_F_3,
    ACT_F_4,
    ACT_R_1,
    ACT_R_2,
    ACT_R_3,
    ACT_R_4,
    ACT_J_1,
    ACT_J_2,
    ACT_J_3,
    ACT_J_4,
    ACT_J_5
  ]
}
