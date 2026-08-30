// security-baseline: mutations log actor, action, entity id, and timestamp —
// structured, no task content or titles in the log line.
export function audit(action: string, entityId: string): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), actor: "local-user", action, entityId }));
}
