import assert from 'node:assert/strict';

// Only the run-owned preview is a network dependency of these local demos.
export async function guardNetwork(context, baseURL) {
  const origin = new URL(baseURL).origin;
  const rejected = new Set();
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    rejected.add(url.origin);
    await route.abort('blockedbyclient');
  });
  await context.routeWebSocket('**/*', (socket) => {
    rejected.add(new URL(socket.url()).origin);
    socket.close({ code: 1008, reason: 'Unexpected network dependency' });
  });
  return () => assert.deepEqual([...rejected], [], 'Unexpected network dependency (origins only)');
}
