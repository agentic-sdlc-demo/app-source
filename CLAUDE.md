# app-source

Full-stack tasklist app. Governed by [sdlc-control](https://github.com/agentic-sdlc-demo/sdlc-control) —
this repo consumes skills and hooks from there via `scripts/sync-governance.sh`, pinned to the ref in `GOVERNANCE_REF`.

## Artifact chain for this build

- Intent: [INT-001](https://github.com/agentic-sdlc-demo/sdlc-control/blob/main/intents/INT-001-tasklist.md)
- Spec: [SPEC-001](https://github.com/agentic-sdlc-demo/sdlc-control/blob/main/specs/SPEC-001-tasklist.md)
- Plan: `plan.md` (this repo, root) — approved before any implementation PR opens.

Every implementation PR references INT-001/SPEC-001 in its description.

## Stack

- **Server**: Node 20, Express, `better-sqlite3`. DB file at `$DB_PATH` (never hard-coded — see `security-baseline`).
- **Web**: React 18 + Vite + TypeScript.
- **Tests**: Vitest (unit/API), Playwright (E2E).
- **Deploy**: Docker Compose, local — `deploy/deploy.sh <staging|prod> <tag>`. Staging port 8090, prod 8091 (gated).

## Commands

```
npm run dev            # server + web, concurrently
npm test                # vitest
npm run test:e2e        # playwright
npm run lint
npm run build
scripts/sync-governance.sh [--check]   # pull / verify governance from sdlc-control
```

## Conventions (enforced by synced skills — see `.claude/skills/`)

- API: `skills/api-standards` — plural kebab-case resources, standard error shape, pagination, `/healthz` + `/metrics`.
- Security: `skills/security-baseline` — validate every boundary, parameterized SQL only, no secrets in code, rate-limit mutations.
- UI: `skills/ui-brand` — explicit empty/loading/error states, one primary action per view, accessible controls.

`.claude/skills/` and `.claude/hooks/` are synced, not authored here — edit them in `sdlc-control` and re-run the sync script.

## Governance enforcement

- `deploy-gate.sh` (synced hook) blocks any prod-deploy command without `deploy/.release-approval` containing the exact tag.
- Managed settings deny reads on `.env`, the GitHub token file, and SSH/gh credentials.
- GitHub operations go through the MCP server (`.mcp.json`) — never raw `gh`/token-in-shell.
