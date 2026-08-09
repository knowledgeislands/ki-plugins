# Bootstrap exemplars

These examples illustrate the scope boundaries in [the bootstrap standard](standards-bootstrap.md). For the exact options supported by an installed release, use `ki help`.

## First-time setup

```sh
ki bootstrap
ki doctor
ki diag
```

The first command detects supported agent runtimes, establishes the user configuration, installs the canonical harness, and activates the seven core user skills. `ki-delegation` remains an opt-in standard for durable delegation packets. `ki doctor` checks the resulting environment; `ki diag` reports the effective configuration, harness inventory, repository, and XDG paths.

Running `ki bootstrap` again leaves correctly managed state in place. Use the refresh form after adding or removing a supported agent runtime or after reconciling installed state:

```sh
ki bootstrap --refresh
```

## Additional compatible harness

```sh
ki harness install example/operations
ki harness list
ki harness info example/operations
```

Installation adds verified capability sources to the user-owned harness set. It does not make every skill in that harness discoverable and does not change a repository.

When exactly one installed harness provides `example-engineering`, activate it for the configured user runtimes:

```sh
ki skill user add example-engineering
```

Remove that activation without uninstalling its harness:

```sh
ki skill user remove example-engineering
```

## Repository activation and maintenance

Given an existing KI repository whose `.ki-config.toml` does not yet declare `ki-change-management-roadmap`, add the installed skill at repository scope:

```sh
ki skill repo add ki-change-management-roadmap --repo .
```

The command adds the `[skills.ki-change-management-roadmap]` declaration and managed runtime-discovery links only for that repository. It does not add the skill to user scope.

Native repository maintenance then resolves the repository's declared skills from verified installed harnesses:

```sh
ki repo educate --repo .
ki repo audit --repo .
ki repo conform --repo . --dry-run
```

Remove the repository declaration and its managed repository links without changing user activation:

```sh
ki skill repo remove ki-change-management-roadmap --repo .
```

## Canonical harness development

Use a checkout only through the explicit development switch:

```sh
ki dev on /absolute/path/to/ki-agentic-harness
ki repo audit --repo /absolute/path/to/governed-repository
ki dev off
```

The first command validates the checkout before switching the canonical installed payload. The last restores the verified archive; proximity to a checkout never changes resolution by itself.
