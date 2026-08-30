#!/usr/bin/env bash
# deploy.sh <staging|prod> <image-tag>
#
# staging: deploys immediately (tier 2 — automatic after merge).
# prod:    requires deploy/.release-approval containing the exact image tag,
#          written by a release manager. The approval is single-use.
set -euo pipefail
cd "$(dirname "$0")"

ENV="${1:?usage: deploy.sh <staging|prod> <image-tag>}"
TAG="${2:?usage: deploy.sh <staging|prod> <image-tag>}"

case "$ENV" in
  staging|prod) ;;
  *) echo "deploy: unknown environment '$ENV'" >&2; exit 1 ;;
esac

if [[ "$ENV" == "prod" ]]; then
  if [[ ! -f .release-approval ]] || [[ "$(tr -d '[:space:]' < .release-approval)" != "$TAG" ]]; then
    echo "deploy: PRODUCTION BLOCKED — no release approval for tag '$TAG'." >&2
    echo "A release manager must run: echo '$TAG' > deploy/.release-approval" >&2
    exit 1
  fi
  rm -f .release-approval  # single use
fi

TASKLIST_TAG="$TAG" docker compose up -d "tasklist-$ENV"
echo "deployed tasklist:$TAG as tasklist-$ENV"
