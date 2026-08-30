# app-source

Full-stack tasklist application for the AI-native SDLC demo, governed by
[`sdlc-control`](https://github.com/agentic-sdlc-demo/sdlc-control).

- **Stack** (from Phase 3 on): Node 20 + Express + better-sqlite3, React + Vite + TypeScript, Vitest + Playwright.
- **Deploys locally** via Docker Compose: `tasklist-staging` on port 8090 (auto after merge), `tasklist-prod` on port 8091 (release-manager gated).
- **Governance**: `scripts/sync-governance.sh` pulls skills, hooks, and agent settings from `sdlc-control` at the ref pinned in `GOVERNANCE_REF`; CI fails on drift.

Every PR links its intent and spec (`INT-*` / `SPEC-*` in `sdlc-control`), extending the
committed-artifact chain: `intent → spec → plan → code + tests → PR review → incident record`.

## Deploy

```
deploy/deploy.sh staging <image-tag>   # automatic path
deploy/deploy.sh prod <image-tag>      # requires deploy/.release-approval (single use)
```

Rollback is `deploy.sh prod <previous-tag>` — images are tagged per commit.
