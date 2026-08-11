#!/usr/bin/env node
const port = process.env.BAI_KNOWLEDGE_HUB_PORT ?? '8787';
try {
  const response = await fetch(`http://127.0.0.1:${port}/readyz`, { signal: AbortSignal.timeout(3000) });
  process.exit(response.ok ? 0 : 1);
} catch { process.exit(1); }
