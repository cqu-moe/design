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
