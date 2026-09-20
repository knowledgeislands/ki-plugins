# Model radar standard

This standard defines a portable evidence and lifecycle contract for reviewing language models and executable model-agent routes. It separates identity, route support, recommendation, retirement, benchmark applicability, and evidence so that no single score silently becomes policy.

## Authority and boundary

The committed `radar.toml` snapshot is the structured current state. External sources support individual claims but do not override reviewed local judgment. `ki-pulse` owns bounded discovery, `ki-tokenomics` owns portable purpose categories, runtime adapters own runtime configuration, and `ki-next` owns downstream work adoption.

AUDIT is read-only. CONFORM may regenerate only the derived rubric publication. Every change to authored radar state remains diagnostic or guarded because correcting a record can change recommendation, support, or retirement meaning.

## Snapshot schema

The root contains `schema = 1`, one `reviewed_on` ISO calendar date, and exactly four map tables: `models`, `routes`, `benchmarks`, and `evidence`. Each record key is its stable lower-case hyphenated identity and each record repeats that value in `id`. Stable identities do not encode a recommendation or lifecycle state.

### Models

A model records `id`, `display_name`, `provider`, `openness`, `license`, `retirement`, `reviewed_on`, `evidence`, and `counter_evidence`.

- `openness` is `proprietary`, `open-weight`, or `open-source-ai-definition`. It applies to the exact variant; family association is not evidence.
- `retirement` is `active`, `retiring`, or `retired`.
- `license` is the exact reviewed licence name or identifier, not a generic open/proprietary label.

### Executable routes

A route records `id`, `model`, `agent`, `protocol`, `access`, `locality`, `recommendation`, `support`, `movement`, `reviewed_on`, `evidence`, and `counter_evidence`.

- `access` is `vendor-api`, `gateway-api`, `subscription-agent`, or `self-hosted`.
- `locality` is `laptop`, `workstation`, `server`, `cluster`, or `unavailable`. A self-hosted route still names its practical locality.
- `recommendation` is `adopt`, `trial`, `assess`, or `hold`.
- `support` is `default`, `available`, `evaluation`, or `not-integrated`.
- `movement` is `new`, `inward`, `outward`, or `unchanged` and describes the current review, not maturity.

`default` support requires `adopt`; a default route cannot use a retiring or retired model. A route for a retired model must be `not-integrated` and `hold`. These checks expose contradictions but do not choose the repair.

### Benchmarks

A benchmark records `id`, `display_name`, `owner`, `unit`, `domain`, `metric`, `constraints`, `reproducibility`, `risks`, `run_cost`, `applicability`, `lifecycle`, `published_on`, `data_as_of`, `reviewed_on`, `evidence`, and optional `successor`.

- `unit` is `bare-model`, `provider-endpoint`, `model-agent`, or `task-environment`.
- `applicability` is `primary`, `corroborating`, `discovery`, or `not-applicable`.
- `lifecycle` is `current`, `watch`, or `retired`.

A retired benchmark is `not-applicable` and may name an existing successor. A current benchmark cannot be `not-applicable`. Publication and data dates remain distinct so old data beneath a recently edited page stays visible.

### Evidence

An evidence record contains `id`, `title`, `url`, `unit`, `independence`, and `reviewed_on`, plus optional `notes`.

- `unit` uses the same vocabulary as benchmark units.
- `independence` is `provider`, `independent`, or `local`.

Every evidence or counter-evidence reference resolves to one evidence record. Counter-evidence is retained rather than averaged away. Provider evidence may establish identity, access, licence, pricing, and lifecycle, but provider-reported performance alone cannot justify inward recommendation movement.

## Dates and freshness

All dates use real `YYYY-MM-DD` calendar values. The snapshot and each record must not be future-dated. REFRESH runs weekly, or earlier when a material release or deprecation warrants it. A review older than 9 days warns: the seven-day cadence has elapsed plus two days of operational grace, but elapsed time alone does not invalidate historical evidence.

## Evidence and movement review

Mechanical validity is only the floor. Reviewers determine whether:

- the evidence evaluates the declared unit and use case;
- materially independent sources corroborate consequential claims where available;
- cost, latency, context, privacy, licence, route availability, and feasible hardware remain visible;
- a trial or adoption has local-fit evidence from public or synthetic work proportional to its consequence; and
- the rationale preserves material uncertainty and counter-evidence.

No benchmark or composite score is universally authoritative. Results from unlike units may corroborate one another but must not be numerically merged without an explicit defensible method.
