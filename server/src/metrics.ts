interface Sample {
  t: number;
  ms: number;
}

const WINDOW_MS = 5 * 60 * 1000;
const samples: Sample[] = [];
let requestCount = 0;
let errorCount = 0;

export function recordRequest(ms: number, isError: boolean): void {
  requestCount++;
  if (isError) errorCount++;
  const now = Date.now();
  samples.push({ t: now, ms });
  while (samples.length && now - samples[0].t > WINDOW_MS) samples.shift();
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function getMetrics() {
  const durations = samples.map((s) => s.ms).sort((a, b) => a - b);
  return {
    p50_ms: percentile(durations, 50),
    p95_ms: percentile(durations, 95),
    p99_ms: percentile(durations, 99),
    requestCount,
    errorCount,
  };
}
