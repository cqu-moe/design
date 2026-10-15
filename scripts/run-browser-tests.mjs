import { createRequire } from 'node:module';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { serveBuild, snapshotPreview, verification } from './verification-runtime.mjs';
const require = createRequire(import.meta.url);
await verification('preview', async (run) => {
  const server = await serveBuild(await snapshotPreview(run));
  run.state.baseURL = server.url;
  try {
    await run.command(
      process.execPath,
      [require.resolve('@playwright/test/cli'), 'test', ...process.argv.slice(2)],
      {
        env: {
          ...process.env,
          DESIGN_E2E_URL: server.url,
          DESIGN_E2E_ARTIFACTS: run.artifacts,
          PLAYWRIGHT_HTML_OUTPUT_DIR: join(run.artifacts, 'html'),
          PLAYWRIGHT_JSON_OUTPUT_FILE: join(run.artifacts, 'results.json'),
        },
      },
    );
    const results = JSON.parse(await readFile(join(run.artifacts, 'results.json'), 'utf8'));
    assert.ok(results.stats.expected > 0, 'The required suite must execute passing tests');
    run.state.tests = results.stats;
  } finally {
    await server.close();
    run.state.serverClosed = true;
  }
});
