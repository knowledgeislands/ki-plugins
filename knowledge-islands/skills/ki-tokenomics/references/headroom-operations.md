# Headroom operational maintenance

The reset contract below is verified against the installed Headroom 0.31.0 CLI and package source. Treat it as version-specific: snapshot the surface you intend to clear, reset only that surface, and re-check the CLI and implementation after an upgrade.

Headroom derives most state from `HEADROOM_WORKSPACE_DIR` (default `~/.headroom`) and also permits `HEADROOM_SAVINGS_EVENTS_PATH` and `HEADROOM_SAVINGS_PATH` to override the two savings files independently. Resolve the active paths before a reset; never infer one store's location from another.

## The statistics surfaces are independent

Headroom exposes several related views, but they do not share one reset:

- **Durable CLI savings ledger** — `headroom savings` reads the path resolved from `HEADROOM_SAVINGS_EVENTS_PATH`, then `HEADROOM_WORKSPACE_DIR`, then the default `~/.headroom/savings_events.jsonl`. `headroom savings --reset` deletes this ledger. It does not clear proxy performance logs, the live `/stats` counters, or the proxy's separate durable history.
- **Performance history** — `headroom perf` reads every `proxy.log*` file below the resolved workspace's `logs/` directory inside its selected time window. Headroom 0.31.0 has no `perf --reset`; the proxy rotates the live file at 10 MB and keeps five numbered backups.
- **Live proxy statistics** — loopback `POST /stats/reset` resets selected in-memory request, compression, and cost counters and invalidates the cached `/stats` snapshot. It is a local test/debug reset, not a durable-history reset: it does not delete either savings file, the performance logs, or the recent-request log.
- **Durable proxy/dashboard savings** — `/stats` reads the savings tracker's configured storage path (resolved from `HEADROOM_SAVINGS_PATH`, then `HEADROOM_WORKSPACE_DIR`, then the default `~/.headroom/proxy_savings.json`). Headroom 0.31.0 exposes no supported live CLI reset for this file. Do not delete it beneath a running proxy: the in-memory tracker can write its old state back.

Consequently, `headroom savings --reset` must not be described as clearing the whole dashboard or its recent-request feed. Resetting one surface leaves the others intact.

## Reset the CLI savings ledger

Inspect or capture the report before deleting it. The JSON `path` field is the exact ledger the same CLI environment will reset; stop if it is not the intended store:

```bash
headroom savings --json
headroom savings --reset
headroom savings --json
```

The final command should report an empty ledger until new Headroom traffic appends another event. The proxy can remain running. If the proxy and shell use different environment overrides, align them before treating this as the proxy's ledger.

## Reset performance history

First resolve the active workspace, then inventory and, if needed, archive the exact files matched by the analyzer:

```bash
workspace="${HEADROOM_WORKSPACE_DIR:-$HOME/.headroom}"
log_dir="$workspace/logs"
find "$log_dir" -maxdepth 1 -type f -name 'proxy.log*' -print
headroom perf --hours 0 --format json
```

For Headroom 0.31.0, a full perf reset means truncating the live file in place and removing its five known rotations:

```bash
: > "$log_dir/proxy.log"
for rotation in "$log_dir"/proxy.log.{1,2,3,4,5}; do
  [ ! -e "$rotation" ] || rm -f "$rotation"
done
headroom perf --hours 0
```

Truncating rather than replacing the live file preserves the file descriptor held by a running proxy. The next request can repopulate it. This live reset can race a rotation: repeat the inventory and `headroom perf --hours 0`, and repeat the known-file cleanup if any pre-reset record remains. Quiesce the proxy first when a deterministic empty boundary is required. If the inventory shows an unexpected `proxy.log*` file, inspect it instead of broadening the removal glob; `headroom perf` will continue to read any matching file that remains.

## Reset durable proxy/dashboard savings

There is no supported live reset in Headroom 0.31.0. Before stopping, read the active path from the loopback proxy's `/stats` response at `.persistent_savings.storage_path`; do not substitute the CLI ledger's path. For an intentional clean start of a deployment managed by `headroom install`:

```bash
headroom install status --profile default
headroom install stop --profile default
```

Substitute the actual profile. `headroom install stop` may return before a raw (`supervisor = none`) runtime finishes its graceful shutdown: do not continue until the configured health endpoint refuses connections and no process is listening on the proxy port. `install status` alone is insufficient because the raw-runtime stop path clears its PID record immediately after sending `SIGTERM`.

Only after that shutdown gate passes, move the confirmed path and restart:

```bash
mv -i /confirmed/path/proxy_savings.json /confirmed/path/proxy_savings.json.before-reset
headroom install start --profile default
```

Choose a different backup name if the destination already exists. If the source file is absent, there is nothing to move; restart the deployment without the `mv` step.

An unmanaged proxy is outside this procedure: stop it with its owning supervisor or process workflow, confirm it is fully down, then move the confirmed storage path. Reset the CLI ledger and perf logs separately only when those histories should also be cleared. New traffic repopulates each cleared store independently.
