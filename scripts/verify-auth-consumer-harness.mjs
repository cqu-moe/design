import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { verification, waitForDetachedChild } from './verification-runtime.mjs';

await verification('auth-consumer-harness', async (run) => {
  assert.ok(process.env.DESIGN_CANDIDATE_PACKAGES, 'DESIGN_CANDIDATE_PACKAGES is required');
  run.state.probes = [];
  for (const [name, flags] of [
    ['extra-payload', { DESIGN_AUTH_EXTRA_PAYLOAD: '1' }],
    ['websocket', { DESIGN_AUTH_PROBE_WEBSOCKET: '1' }],
    ['timeout-and-cleanup', { DESIGN_AUTH_PROBE_TIMEOUT: '1', DESIGN_AUTH_FAIL_CLEANUP: '1' }],
  ]) {
    let output = '';
    const child = spawn(
      process.execPath,
      ['scripts/verify-auth-consumer.mjs', '--variant', 'desktop'],
      {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          CI: process.env.CI,
          DESIGN_CANDIDATE_PACKAGES: resolve(process.env.DESIGN_CANDIDATE_PACKAGES),
          ...flags,
        },
      },
    );
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
    }
    const result = await waitForDetachedChild(child, 12 * 60_000);
    await writeFile(join(run.artifacts, `${name}.log`), output);
    assert.equal(result.timedOut, false, `${name} probe itself must finish`);
    assert.equal(result.code, 1, `${name} must fail for its intended guard`);
    const artifacts = output.match(/Verification failed: (.+)/)?.[1];
    assert.ok(artifacts, `${name} must retain its run record`);
    const state = JSON.parse(await readFile(join(artifacts, 'run.json'), 'utf8'));
    assert.equal(state.result, 'failed');
    assert.equal(state.cleanup, true);
    await assert.rejects(access(state.work));
    if (name === 'extra-payload') {
      assert.equal(state.extraPayloadProbe, 'node_modules/arbitrary.js');
      assert.match(state.error, /payload beyond the candidate and declared pnpm shims/);
      assert.match(state.error, /node_modules\/arbitrary.js/);
    } else {
      const desktop = join(artifacts, 'desktop');
      const runtime = JSON.parse(await readFile(join(desktop, 'runtime.json'), 'utf8'));
      assert.deepEqual(runtime.listenersClosed, { auth: true, control: true });
      const runner = JSON.parse(await readFile(join(desktop, 'runner.json'), 'utf8'));
      assert.equal(runner.cleanup, 'passed');
      assert.ok(
        (await readdir(desktop, { recursive: true })).some((path) => path.endsWith('.png')),
      );
      if (name === 'websocket') {
        assert.equal(runtime.cleanup, 'passed');
        const report = JSON.parse(await readFile(join(desktop, 'report.json'), 'utf8'));
        assert.equal(report.run.summary.executed, 1);
        assert.equal(report.run.summary.failed, 1);
        assert.match(JSON.stringify(report.run.results), /ws:\/\/127\.0\.0\.1/);
        const socket = JSON.parse(await readFile(join(desktop, 'websocket-probe.json'), 'utf8'));
        assert.equal(socket.code, 1008);
        const server = JSON.parse(await readFile(join(desktop, 'websocket-server.json'), 'utf8'));
        assert.deepEqual(server, { connections: 0, closed: true });
      } else {
        assert.equal(runner.timedOut, true);
        assert.equal(runtime.cleanup, 'failed');
        assert.match(runtime.primaryError, /Auth consumer runner exceeded 15000 ms/);
        assert.match(runtime.cleanupError, /Controlled Auth runtime cleanup failure/);
        assert.match(state.error, /Auth consumer runner exceeded 15000 ms/);
        assert.match(state.error, /Controlled Auth runtime cleanup failure/);
        assert.match(
          await readFile(join(desktop, 'runner.log'), 'utf8'),
          /hang after real browser navigation/,
        );
      }
    }
    run.state.probes.push({ name, artifacts, exitCode: result.code, cleanup: 'passed' });
    console.log(`${name}: intended failure and cleanup verified; ${artifacts}`);
  }
});
