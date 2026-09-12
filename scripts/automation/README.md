# Local GitHub issue worker

One checkout, one worker, one active issue. The shell entrypoints call `worker.py`,
a Python 3 standard-library implementation. It polls once per invocation; macOS
launchd invokes it approximately every 60 seconds while you are logged in and the
machine is awake. It does not start a second worker while an invocation is running.

This is repository tooling, not a Codex app scheduled task. Installation is explicit.
The implementation and validation do not install or start the scheduler.

## Requirements and initial setup

- macOS for scheduling; Python 3, Git, GitHub CLI (`gh`), Codex CLI (`codex`), npm.
- An `origin` remote on github.com using credential-free HTTPS or SSH.
- GitHub authentication with issue read/write permission, and Codex authentication.
- Repository npm dependencies and the development environment described in the
  root README (including Prisma generation/database configuration where needed).
- A clean checkout. Review and commit this automation, then land it on the remote
  default branch before processing work. The worker refuses a base that would
  remove or change its installed automation scripts.

```sh
gh auth login
codex login
codex login status
gh auth status
npm install
chmod +x scripts/automation/*.sh
./scripts/automation/codex-worker.sh --dry-run
```

The worker finds Codex on PATH, or falls back to the executable bundled inside
`ChatGPT.app` in `/Applications` or your personal `~/Applications` directory.
You do not need to change shell configuration when using that bundled executable.
For a custom installation, set an absolute executable path explicitly:

```sh
export CODEX_BIN="/absolute/path/to/codex"
"$CODEX_BIN" login status
./scripts/automation/codex-worker.sh --dry-run
```

The installer saves the resolved Codex path in the LaunchAgent, so scheduled runs
do not depend on the desktop app's PATH. Reinstall the scheduler if that path moves.

The worker explicitly selects `gpt-5.5` (verified with this ChatGPT account), avoiding
an obsolete `gpt-5.3-codex` model in the global CLI configuration. It does not edit
that configuration. To select another model supported by your account, export
`CODEX_MODEL` before manual execution or scheduler installation. The installer saves
that selection in the plist; reinstall to change an installed override.

The current validation contract is `npm test`, `npm run lint`, `npm run build`.
All three must succeed. Existing application failures block an issue as well;
fix those deliberately, never bypass the gate. The issue agent must additionally
run any issue-specific tests required by AGENTS.md or acceptance criteria.

## Selection and state transitions

The worker queries one oldest-created **open** issue with `ready`, excluding
`in-progress`, `review`, and `blocked`. Other domain labels are preserved. If
**any open issue** is already `in-progress`, it skips new work. Selection and
revalidation happen before claiming. The installer creates missing labels without
changing existing label colors or descriptions:

- `ready`: authorized for unattended implementation.
- `in-progress`: claimed, before branch creation or Codex execution.
- `review`: Codex explicitly reported completion and every independent check passed.
- `blocked`: Codex, validation, branch creation, or an interrupted execution failed.

Issues are never automatically closed. Failure comments are fixed text containing
no subprocess output, credentials, environment variables, or local paths. Success
is recorded by the `review` label and local status; no success comment is required.

GitHub label edits are **not** a distributed compare-and-swap lock. Install only
one worker for this repository, on one machine/checkout. This first version does
not support multiple installations, worktrees, or parallel agents. People and other
bots should not change state labels during a run.

## Execution and Git safety

```sh
# A single real poll: may claim and implement one ready issue
./scripts/automation/codex-worker.sh

# Read-only inspection: does not create even the runtime directory
./scripts/automation/codex-worker.sh --dry-run
```

A dirty checkout (including untracked files) prevents claiming. Dry-run still shows
the eligible issue and reports the dirty-tree gate so you can test while reviewing
this implementation. It does not fetch, create branches, lock, write logs/state,
change labels, comment, or execute Codex. Optional Git index writes and gh update
notifications are disabled for subprocesses.

A real run fetches the remote's discovered default branch into its remote-tracking
ref. It never pulls into or resets your local default branch. It creates
`agent/issue-123-implementation` directly from that fetched ref. Existing branches
are never reused, overwritten or deleted. Git refs omit the issue title to avoid
embedding sensitive text. A clean checkout can still be in use by a person: do not
edit or switch branches concurrently with the worker.

The complete issue and comments are read with gh before claiming and provided as
a temporary local snapshot for Codex when sandbox network access is unavailable.
Codex runs with `workspace-write`, `approval_policy="never"`, and stdin closed.
`never` means denied operations cannot prompt for escalation; it does not grant
extra permissions. The worker never enables bypass flags or changes Codex config.
If sandbox restrictions prevent completion, the issue must be reported incomplete
and becomes blocked. Configured Codex tools/rules still apply; the issue text is
not a security boundary or authority to weaken them.

Codex must return a structured `completed` result. Exit zero alone is insufficient.
The worker then verifies the branch and HEAD, checks existing automation files
were not modified, and independently executes the three npm commands. It does
not commit, push, create a PR, merge, delete branches, or clean up application edits.
Successful changes stay locally on the issue branch for human review. This means
the next issue waits for the checkout to become clean. Inspect the diff and tests,
then commit/push/open a PR yourself or explicitly ask Codex to do so.

Codex and each validation command have a one-hour timeout; GitHub commands have a
60-second timeout and fetch has 120 seconds. A timeout or signal terminates the
command process group, escalating to SIGKILL after five seconds. Background jobs
are forbidden in the agent prompt. A hung entire task is therefore bounded by
these individual timeouts. A machine sleep delays wall-clock scheduling.

## Locking, state and recovery

Runtime data is ignored by Git under `.codex-automation/`, created with restrictive
permissions. Do not share this directory; the issue snapshot can contain private
issue text. Normal exit removes the snapshot; a hard kill may leave it until the
next real run.

- `worker.lock`: persistent inode with macOS-compatible `fcntl.flock`. Never delete
  it to unlock a running worker. The kernel releases locks when owners exit; there
  is no stale PID lock to remove. Child commands inherit the descriptor so a parent
  crash does not immediately allow another worker beside a still-running child.
- `current-issue`: atomically written/fsynced JSON journal including issue, PID,
  branch, start time and phase; written **before** the GitHub claim.
- `last-run`: last result, timestamps, failure diagnostic and the last issue branch
  where applicable. Idle polls preserve this result instead of erasing failures.
- `last-check`: timestamp of the latest idle poll.
- `logs/worker.log`: timestamps, sanitized title, issue, branch, Codex/check start
  and exit status, errors and GitHub transitions. Rotates at 1 MiB, four backups.
- `logs/launchd.stdout.log` and `launchd.stderr.log`: scheduler diagnostics,
  truncated in place on worker startup after exceeding 1 MiB. If Python or the
  worker entrypoint itself is broken, disable the scheduler while repairing it.

Raw stdout is intentionally discarded. Stderr is continuously drained into a
bounded 64 KiB memory buffer. On nonzero exit only, up to 8,000 characters of
filtered diagnostic text are included in the rotating worker log and failure state.
The filter removes recognized tokens, sensitive environment values, authorization
headers, credential assignments, URLs and home/private paths before writing.
This is best-effort filtering, not a guarantee for arbitrary secret formats; never
print credentials in commands or tests. GitHub comments still use fixed text only.
Common credential and private-path patterns are redacted from issue titles; keep
secrets out of GitHub issues entirely. To diagnose a failing validation command,
stop scheduling and run the named command interactively. Codex's own session
storage follows your existing CLI settings; it is separate from worker logs.

Signals and normal exceptions close the lock. If GitHub cannot confirm `blocked`
or the failure comment, the journal remains. A later invocation reconciles it
before doing any new work: a validated issue already in `review` is preserved;
otherwise the interrupted/uncertain attempt is conservatively marked `blocked`.
A crash between journal creation and claiming may therefore block an issue that
never started. Recovery never discards source changes. If an `in-progress` issue
has no local journal, it blocks new work until a human investigates it.

## Install and stop the macOS scheduler

After reviewing/committing the automation and landing it on the remote default branch:

```sh
./scripts/automation/install-macos-worker.sh
./scripts/automation/status.sh
```

The installer checks dependencies, gh/Codex authentication and a clean checkout;
creates missing labels; generates a plist with `StartInterval = 60` and
`RunAtLoad = true`; validates it using `plutil`; and loads it using
`launchctl bootstrap`. **Installation starts polling immediately** and may consume
an existing ready issue. No username or repository path is hardcoded.

The identifier is `com.codex.<sanitized-repository-name>.<path-hash>.worker`.
The hash prevents collisions between different repositories with the same name.
The plist lives under `~/Library/LaunchAgents/`. It records the absolute Python
and repository paths and current PATH, not credentials. Run the installer from a
terminal where `gh`, `codex`, npm and Git are available. Standard HOME-based CLI
credentials are used; shell-only tokens/custom CODEX_HOME are not copied into the
plist. Moving the checkout or Python installation requires uninstall/reinstall.

```sh
# Temporarily disable, or permanently uninstall (same safe operation)
./scripts/automation/uninstall-macos-worker.sh

# Re-enable later, after addressing any retained branch/journal
./scripts/automation/install-macos-worker.sh
```

Uninstall bootouts the service, removing the generated plist only once it is
stopped. It keeps project logs, state and branches. Interrupting an active worker
can block that issue; inspect status before stopping.

## Status, logs, and blocked issues

```sh
./scripts/automation/status.sh
tail -n 80 .codex-automation/logs/worker.log
gh issue list --label blocked
gh issue view 123 --comments
git status --short
git diff
```

Status works before installation and when idle. It reports whether the plist is
installed, whether launchd has loaded it, local lock ownership, journal issue,
last branch/result/time and the active issue's GitHub labels (or unavailable).

To retry a blocked issue:

1. Disable scheduling. Inspect the issue, logs, local journal and retained branch.
2. Preserve and review changes; never reset/clean/stash automatically. Commit useful
   work deliberately. Since retries use the same branch name, rename the retained
   branch to an unused name, e.g. `git branch -m agent/issue-123-attempt-1`, while
   on it. The retry starts fresh from the remote default, so describe any work it
   should reuse in the issue.
3. If a journal remains, restore GitHub access and run the worker once to reconcile
   it before requeuing. That recovery invocation never starts new work.
4. Once the checkout is clean and the cause is fixed, requeue explicitly:

   ```sh
   gh issue edit 123 --remove-label blocked --add-label ready
   ./scripts/automation/codex-worker.sh --dry-run
   ./scripts/automation/install-macos-worker.sh
   ```

For an orphaned `in-progress` issue, first establish that no worker remains alive
on any machine. Preserve work and move it to `blocked` for investigation before
following the retry procedure. Never remove a lock file as a recovery shortcut.

Troubleshooting: missing commands require PATH repair/reinstallation; auth failures
require `gh auth login` or `codex login`; network errors preserve uncertain journal
state; dirty-tree errors require human review; an existing issue branch requires
preservation/rename; missing default-branch automation requires landing these files;
validation failures require reproducing the named npm command. A failed `bootstrap`
can leave a plist without a loaded job: status will show this; uninstall then retry.

## Offline verification

```sh
for script in scripts/automation/*.sh; do sh -n "$script"; done
# Optional, if installed:
shellcheck scripts/automation/*.sh
python3 -B -m unittest discover -s scripts/automation -p 'test_*.py' -v
./scripts/automation/codex-worker.sh --dry-run
```

Tests use fake GitHub/Codex responses and temporary directories. They exercise
claim order, validation gates, incomplete success, dirty trees, interruptions,
network recovery, lock contention, timeouts, idle status and dry-run immutability.
They do not change real labels or run Codex on real issues.
