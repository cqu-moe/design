import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('auth consumer verification requires the source-job candidate artifact', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-auth-consumer.mjs'], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DESIGN_CANDIDATE_PACKAGES is required/);
});

for (const args of [
  ['--browser', 'safari'],
  ['--browser'],
  ['--browser', 'firefox', '--browser', 'webkit'],
]) {
  test(`auth consumer rejects invalid browser selection before preparing Auth: ${args.join(' ')}`, () => {
    const result = spawnSync(process.execPath, ['scripts/verify-auth-consumer.mjs', ...args], {
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH,
        DESIGN_CANDIDATE_PACKAGES: '/does-not-exist-browser-contract',
      },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--browser chromium\|firefox\|webkit/);
    assert.doesNotMatch(result.stdout, /Verification|git clone/);
  });
}
