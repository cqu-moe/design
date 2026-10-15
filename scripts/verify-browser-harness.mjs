import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { verification } from './verification-runtime.mjs';

await verification('harness', async (run) => {
  const configImport = relative(run.work, resolve('playwright.config.ts')).replaceAll('\\', '/');
  const fixtureImport = relative(run.work, resolve('tests/helpers/browser.ts')).replaceAll(
    '\\',
    '/',
  );
  const config = join(run.work, 'playwright.config.ts');
  await writeFile(
    config,
    `import config from '${configImport}';
export default { ...config, testDir: '.', testMatch: '*.browser.spec.ts' };
`,
  );
  await writeFile(
    join(run.work, 'negative.browser.spec.ts'),
    `import { test, expect } from '${fixtureImport}';
test('wrong assertion must fail with browser evidence', async ({ page }) => {
  await page.goto('/components');
  await expect(page.getByRole('button', { name: '打开弹窗' })).toHaveText('deliberately incorrect', { timeout: 300 });
});
test('unplanned external request must fail even when the page catches it', async ({ page }) => {
  await page.goto('/components');
  await page.evaluate(() => fetch('https://unexpected.invalid/probe').catch(() => {}));
});
test('manual touch context retains evidence for a caught external request', async ({ newContext }) => {
  const context = await newContext({ viewport: { width: 390, height: 740 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/components');
  await page.evaluate(() => fetch('https://unexpected.invalid/probe').catch(() => {}));
});
`,
  );
  for (const [name, args] of [
    ['negative', []],
    ['zero-tests', ['--grep', 'no-such-case', '--pass-with-no-tests']],
  ]) {
    const child = spawnSync(
      process.execPath,
      ['scripts/run-browser-tests.mjs', '--config', config, '--project=chromium-desktop', ...args],
      { encoding: 'utf8', timeout: 120_000 },
    );
    await writeFile(join(run.artifacts, `${name}.log`), child.stdout + child.stderr);
    assert.equal(child.status, 1, `${name} must exit nonzero for its intended failure`);
    const artifact = child.stdout.match(/Verification failed: (.+)/)?.[1];
    assert.ok(artifact, `${name} must produce a run record`);
    const state = JSON.parse(await readFile(join(artifact, 'run.json'), 'utf8'));
    assert.equal(state.result, 'failed');
    assert.equal(state.cleanup, true);
    assert.equal(state.serverClosed, true);
    await assert.rejects(access(state.work));
    await assert.rejects(fetch(state.baseURL));
    const results = JSON.parse(await readFile(join(artifact, 'results.json'), 'utf8'));
    if (name === 'negative') {
      assert.equal(results.stats.unexpected, 3);
      const cases = results.suites.flatMap((suite) => suite.specs).flatMap((spec) => spec.tests);
      assert.ok(
        cases.some((test) =>
          test.results.some((result) =>
            result.errors.some((error) => error.message?.includes('deliberately incorrect')),
          ),
        ),
      );
      assert.ok(
        cases.some((test) =>
          test.results.some((result) =>
            result.errors.some((error) => error.message?.includes('Unexpected network dependency')),
          ),
        ),
      );
      for (const test of cases) {
        const attachments = test.results.flatMap((result) => result.attachments);
        assert.ok(
          attachments.some((item) => item.contentType === 'image/png'),
          'Every failed context needs a screenshot',
        );
        assert.ok(attachments.some((item) => item.name === 'trace'));
      }
    } else {
      assert.equal(results.stats.expected, 0);
      assert.match(child.stderr, /required suite must execute passing tests/);
    }
    run.state[name] = artifact;
  }
});
