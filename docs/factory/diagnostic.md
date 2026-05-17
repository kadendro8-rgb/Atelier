# Foreman diagnostic protocol

Run this when an agent run **exits without a final report** (see the Final
gate in `docs/factory.md`), or returns with unexpected state. The goal is to
establish ground truth before touching anything — never commit partial or
unverified agent output.

## Steps

1. **Tree state** — `git status --short` and `git stash list`. Identify which
   files are modified/untracked and whether work leaked into the main checkout
   instead of the agent's worktree.
2. **History** — `git log --oneline -10`, `git log --all --oneline -20`, and
   `git reflog --date=iso | head -30`. Determine whether the agent committed,
   and to which branch.
3. **Worktrees** — `git worktree list`. Check whether the agent's worktree
   branch advanced past its base commit.
4. **Deliverables present?** — `ls` the files the agent's brief promised.
5. **Read-only verification** — `npm run build`, `npm run typecheck`,
   `npm run lint`. These read source and only write `.next/`; safe to run even
   if the agent may still be active. (Clear `.next/` first if a route was
   moved/renamed — stale generated types cause false typecheck errors.)
6. **Decide:**
   - Builds clean + deliverables complete → integrate (review the diff, apply
     any corrections, commit, push).
   - Broken or partial → do **not** commit. Report the precise state to the
     foreman and decide salvage vs. re-dispatch together.

## Rule

Two pairs of eyes on a recovery is cheaper than a second corruption. When in
doubt, report state and hold — never salvage blind.
