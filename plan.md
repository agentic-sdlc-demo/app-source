# Build plan — SPEC-001 shared tasklist

Derived from [SPEC-001](https://github.com/agentic-sdlc-demo/sdlc-control/blob/main/specs/SPEC-001-tasklist.md).
This is the Stage 3 plan-mode artifact — **implementation starts only after this plan is approved (merged).**

## Repository layout to create

```
server/
  src/
    db.ts              # better-sqlite3 connection, schema migration on boot
    schema.sql          # Lists, Tasks tables (see SPEC-001 data model)
    middleware/
      validate.ts        # request validation per api-standards
      errors.ts           # standard error shape + handler
      rateLimit.ts         # per-IP token bucket on mutating routes
      audit.ts              # structured mutation log (security-baseline)
    routes/
      lists.ts
      tasks.ts
      health.ts            # /healthz, /metrics
    metrics.ts             # in-memory p50/p95/p99 + counters, read by /metrics
    app.ts                # express app assembly (security headers, routes)
    index.ts               # entrypoint, reads DB_PATH from env
  tests/
    lists.test.ts
    tasks.test.ts
    validation.test.ts
    security.test.ts       # parameterized-query + rate-limit assertions

web/
  src/
    api/client.ts          # fetch wrapper, typed
    components/
      TaskList.tsx
      TaskRow.tsx
      AddTaskInput.tsx
      FilterBar.tsx
      EmptyState.tsx
      ErrorState.tsx
    App.tsx
    main.tsx
  tests/
    TaskList.test.tsx
    AddTaskInput.test.tsx
  e2e/
    tasklist.spec.ts        # playwright: capture, complete, filter, delete

package.json (workspaces: server, web)
Dockerfile                  # multi-stage: build web, run server serving web/dist + API
```

## Implementation order

1. **Server foundation**: `db.ts` + `schema.sql` (Lists, Tasks per SPEC-001), `app.ts` with security headers wired, `health.ts` (`/healthz` first — needed by Compose healthcheck and CI).
2. **Lists + Tasks routes**, validation middleware, standard error shape, parameterized queries throughout. Unit + API tests alongside each route, not after.
3. **Rate limiting + audit logging** on mutating routes (complete, reopen, delete, create, patch).
4. **`/metrics`** — latency histogram + counters; this is a hard dependency for Phase 4 (self-verification) and Phase 6 (Stage 6 detection), so it lands before the web app.
5. **Web app**: `TaskList` + `AddTaskInput` first (the 5-second-capture acceptance criterion), then `FilterBar`, then empty/error states, then the detail-edit/delete flow.
6. **Playwright E2E** covering the acceptance criteria in SPEC-001 verbatim (capture, complete/reopen with 409 reconciliation, filter AND-combination, delete confirm, validation 400s).
7. **Dockerfile** + local `docker build` verification against `deploy/docker-compose.yml` (already in place from Phase 0).

## Parallel orchestration

- **Worktree A** — server (steps 1–4).
- **Worktree B** — web (step 5), started once the Lists/Tasks route contracts are stable (after step 2) so the API client has a real contract to build against.
- **Subagent** — test scaffolding for both, and the Playwright E2E suite (step 6), so it can run against both once they land.
- One engineer reviews both streams before merge; every PR references INT-001 and SPEC-001.

## Test strategy (Stage 4 preview)

- Unit/API tests run in-session before a PR opens (self-verification, per playbook).
- `security.test.ts` directly encodes the `evals/cases/endpoint-security.md` assertions (parameterized SQL, validated boundaries, standard error shape) so Stage 5 review has something automated to point at, not just skill text.
- `.claude/settings.json`'s Stop hook runs `npm test` + lint on every session stop.

## Out of scope for this build (per SPEC-001 / INT-001 non-goals)

Integrations, multi-team workspaces, real-time collaborative editing, native mobile apps, auth/roles beyond the single implicit local user.

## Exit criteria

All SPEC-001 acceptance criteria pass locally; `deploy/deploy.sh staging <tag>` serves the real app on port 8090; `evals/run-evals.sh` (from sdlc-control) still passes unchanged.
