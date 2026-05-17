# Mission Template

Every Atelier factory agent mission follows this shape. Copy this template, fill in the brackets, paste to the agent.

## Mission: [name]

### Pre-flight (MANDATORY)

Run `./scripts/preflight.sh`. If exit code != 0, stop and report the output. Do not proceed.

### Branch

```bash
git checkout -b feat/[mission-slug]
```

### Notification — start

```bash
./scripts/notify.sh "🟢 [mission name] started on branch feat/[mission-slug]"
```

### Work

[Specific, scoped task. Terminal-only operations. No browser, no dashboard work. List exact files to touch — be explicit about what's in scope and what isn't.]

### Quality gates (MANDATORY before commit)

All three must exit 0:

```bash
npm run typecheck
npm run lint
npm run build
```

If any fails: see "Self-diagnose on failure" below.

### Self-diagnose on failure

If any gate fails or any unexpected error occurs:

```bash
./scripts/self-diagnose.sh > /tmp/diagnose.log 2>&1
./scripts/notify.sh "🚨 [mission name] stuck — see /tmp/diagnose.log"
```

Then STOP. Paste the contents of `/tmp/diagnose.log` as your final report. Do not attempt fixes. Wait for foreman direction.

### Commit

One conventional commit. Push to feature branch:

```bash
git add [explicit file list — never -A on the first version]
git commit -m "feat([area]): [one-line description]"
git push -u origin feat/[mission-slug]
```

### Open PR (draft)

PR title: `feat([area]): [one-line description]`

PR description must include:
- One-paragraph summary of what shipped
- Foreman post-merge actions required (if any)
- Quality gate results: typecheck exit 0, lint exit 0, build exit 0

### Notification — success

```bash
./scripts/notify.sh "✅ [mission name] PR opened: [URL]"
```

### Final report (MANDATORY)

Post as the last message in this run:

```
W2-style final report
---------------------
git status: <output>
git log --oneline -3: <output>
typecheck exit: 0
lint exit: 0
build exit: 0
PR opened: <URL>

Summary: <one paragraph>
Foreman post-merge actions: <list or "none">
```

### Hard rules

- Touch only files explicitly in scope. No `git add -A` until you know what's staged.
- Conventional commits only.
- No fixing other issues you notice — file them as separate GitHub issues or document in `docs/factory/polish-backlog.md`.
- No scope creep into other workers' territory.
- If you encounter ambiguity, leave a `// DECISION:` comment in the relevant file and proceed with the best call.
