import test from 'node:test';
import assert from 'node:assert/strict';
import { serveBuild } from '../scripts/verification-runtime.mjs';

test('two production listeners own distinct ports and close without borrowing another server', async () => {
  const first = await serveBuild(new URL('../apps/preview/dist', import.meta.url).pathname);
  let second;
  try {
    second = await serveBuild(new URL('../apps/preview/dist', import.meta.url).pathname);
    assert.notEqual(first.url, second.url);
    for (const server of [first, second]) {
      const response = await fetch(server.url + '/components');
      assert.equal(response.status, 200);
      assert.doesNotMatch(await response.text(), /\/@vite\/client/);
    }
    await first.close();
    await assert.rejects(fetch(first.url));
    assert.equal((await fetch(second.url)).status, 200);
  } finally {
    if (second) await second.close();
    await first.close();
  }
});

test('missing production output fails before opening a listener', async () => {
  await assert.rejects(
    serveBuild(new URL('../.verification/nonexistent-build', import.meta.url).pathname),
    { code: 'ENOENT' },
  );
});
