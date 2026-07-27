# Knowledge Islands Activity standard

This standard defines Activity notes: the operational record of intentional automation, scheduling, agentic behaviour, and recurring manual processes adopted by a Knowledge Islands base.

## Collection

The default collection is `Admin/Operations/Activities/`. One note named `<Activity Name>.md` describes one behaviour, and `Activities.md` indexes the collection.

A base may declare a different relative collection path with `activities_dir` under `[ki-kb-activities]`. The path must remain beneath the base and must not traverse a symbolic link. The optional `harness` key names a harness root, absolute or relative to the base, used only to resolve declared skill names at `skills/<name>/SKILL.md`. These are the only recognized keys; AUDIT warns on unknown keys and leaves every sibling configuration table untouched.

When activity notes exist, `Activities.md` lists every note. CONFORM may safely create a missing index or append missing entries to a regular index file. It must not create the collection directory, replace a non-regular index entry, follow a symbolic link, or write directly; it prepares one proposal for the host.

## Frontmatter

An activity note that carries frontmatter declares:

| Key           | Value                                  |
| ------------- | -------------------------------------- |
| `status`      | `active` \| `paused` \| `retired`      |
| `realization` | The execution form described below.    |
| `author`      | Who authored or adopted this activity. |

The `ki-kb` skill owns general note frontmatter such as tags and dates.

## Realization

The known realization values are:

| Value            | Meaning                                                       |
| ---------------- | ------------------------------------------------------------- |
| `slash-command`  | A runtime skill named by the `skill` field.                   |
| `scheduled-task` | An external scheduled job named by the `schedule_name` field. |
| `conversational` | A recurring conversational pattern invoked by the user.       |
| `manual`         | A human-run process documented for operational completeness.  |
| `workflow`       | A multi-step automated workflow.                              |

Additional values are allowed. AUDIT reports them as `INFO` so a new execution environment can be documented without first changing this skill.

A `slash-command` activity declares `skill: <skill-name>`. When a harness is configured, AUDIT verifies `skills/<skill-name>/SKILL.md` exists beneath it.

A `scheduled-task` activity declares `schedule_name` and may declare a free-text `schedule_env`. AUDIT can check that the name is present but cannot verify external registration, so it reports the registration check as `INFO`.

## Judgment

Each activity note explains what the activity does, when it runs, and why it was adopted. Retired activities retain a rationale. Slash-command activities point readers to useful skill documentation or trigger guidance. Scheduled-task notes state their cadence and expected outcome.

The index is current, ordered, and useful to a reader, including status and realization information rather than serving as a bare mechanically complete list.
