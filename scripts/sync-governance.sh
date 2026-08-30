#!/usr/bin/env bash
# Syncs governance from sdlc-control at the ref pinned in GOVERNANCE_REF:
#   skills/            -> .claude/skills/
#   hooks/             -> .claude/hooks/
#   managed-settings.json is compared against .claude/settings.json baseline.
#
#   sync-governance.sh          copy files into place
#   sync-governance.sh --check  fail if local copies drift from the pinned ref
set -euo pipefail
cd "$(dirname "$0")/.."

REF="$(tr -d '[:space:]' < GOVERNANCE_REF)"
REPO_URL="https://github.com/agentic-sdlc-demo/sdlc-control.git"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CLONE_ARGS=(--depth 1 --branch "$REF" "$REPO_URL" "$TMP/gov")
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  # CI: authenticate with the workflow secret using Basic auth, the scheme
  # GitHub's git-over-HTTPS actually expects (matches what actions/checkout
  # itself sets up) — a Bearer header here is silently rejected and git
  # falls back to an interactive prompt, which fails non-interactively.
  AUTH_B64="$(printf '%s' "x-access-token:$GITHUB_TOKEN" | base64 | tr -d '\n')"
  git -c http.extraheader="AUTHORIZATION: basic $AUTH_B64" clone "${CLONE_ARGS[@]}" -q
else
  # sdlc-control is public, so an unauthenticated clone also works (local dev).
  git clone "${CLONE_ARGS[@]}" -q
fi

if [[ "${1:-}" == "--check" ]]; then
  diff -r "$TMP/gov/skills" .claude/skills \
    && diff -r "$TMP/gov/hooks" .claude/hooks \
    || { echo "governance drift: local .claude/ differs from sdlc-control@$REF" >&2; exit 1; }
  echo "governance in sync with sdlc-control@$REF"
else
  mkdir -p .claude
  rm -rf .claude/skills .claude/hooks
  cp -r "$TMP/gov/skills" .claude/skills
  cp -r "$TMP/gov/hooks" .claude/hooks
  chmod +x .claude/hooks/*.sh
  echo "synced governance from sdlc-control@$REF"
fi
