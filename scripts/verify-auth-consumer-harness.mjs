import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, open, readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { finalizePrivateLog, verification, waitForDetachedChild } from './verification-runtime.mjs';

await verification(
  'auth-consumer-harness',
  async (run) => {
    assert.ok(process.env.DESIGN_CANDIDATE_PACKAGES, 'DESIGN_CANDIDATE_PACKAGES is required');
    run.state.probes = [];
    const probes = [
      ['extra-payload', { DESIGN_AUTH_EXTRA_PAYLOAD: '1' }],
      [
        'artifact-scan',
        {
          DESIGN_AUTH_PROBE_SECRET_ARTIFACT: '1',
          DESIGN_AUTH_BREAK_ASSERTION: '1',
          DESIGN_AUTH_FAIL_CLEANUP: '1',
        },
      ],
      ['runner-output-secret', { DESIGN_AUTH_BREAK_ASSERTION: '1', DESIGN_AUTH_FAIL_CLEANUP: '1' }],
      ['websocket', { DESIGN_AUTH_PROBE_WEBSOCKET: '1' }],
      ['timeout-and-cleanup', { DESIGN_AUTH_PROBE_TIMEOUT: '1', DESIGN_AUTH_FAIL_CLEANUP: '1' }],
    ];
    const selected = process.argv.includes('--probe')
      ? process.argv[process.argv.indexOf('--probe') + 1]
      : undefined;
    assert.ok(
      !process.argv.includes('--probe') || probes.some(([name]) => name === selected),
      'Unknown harness probe',
    );
    for (const [name, flags] of probes.filter(([name]) => !selected || selected === name)) {
      const preload = join(run.privateArtifacts, 'runner-output-probe.cjs');
      if (name === 'runner-output-secret') {
        // Fault injection lives in the harness. No consumer/product switch or scanner bypass.
        await writeFile(
          preload,
          `
const cp = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');
const originalSpawn = cp.spawn;
cp.spawn = function(command, args, options) {
  if (args?.[0] === 'node_modules/e2e/dist/cli/bin.js') {
    args = ['--require', __filename, ...args];
  }
  return originalSpawn.call(this, command, args, options);
};
syncBuiltinESMExports();
if (process.argv[1]?.endsWith('/e2e/dist/cli/bin.js')) {
  process.stdout.write('runner-stdout-secret=' + process.env.AUTH_CONSUMER_PASSWORD + '\\n');
  process.stderr.write('runner-stderr-secret=' + process.env.AUTH_CONSUMER_PASSWORD + '\\n');
}
`,
          { flag: 'wx', mode: 0o600 },
        );
      }
      const logPath = join(run.privateArtifacts, `${name}.log`);
      const log = await open(logPath, 'wx', 0o600);
      let result;
      const failures = [];
      try {
        const child = spawn(
          process.execPath,
          [
            ...(name === 'runner-output-secret' ? ['--require', preload] : []),
            'scripts/verify-auth-consumer.mjs',
            '--variant',
            'desktop',
          ],
          {
            detached: true,
            stdio: ['ignore', log.fd, log.fd],
            env: {
              PATH: process.env.PATH,
              HOME: process.env.HOME,
              TMPDIR: process.env.TMPDIR,
              CI: process.env.CI,
              DESIGN_CANDIDATE_PACKAGES: resolve(process.env.DESIGN_CANDIDATE_PACKAGES),
              ...(process.env.AUTH_E2E_REPOSITORY
                ? { AUTH_E2E_REPOSITORY: process.env.AUTH_E2E_REPOSITORY }
                : {}),
              ...flags,
            },
          },
        );
        result = await waitForDetachedChild(child, 12 * 60_000);
      } catch (error) {
        failures.push({ phase: 'primary', error });
      }
      await finalizePrivateLog(log, failures);
      const bytes = await readFile(logPath);
      const output = bytes.toString('utf8');
      await writeFile(
        join(run.artifacts, `${name}.json`),
        JSON.stringify(
          {
            probe: name,
            ...result,
            output: {
              bytes: bytes.length,
              sha256: createHash('sha256').update(bytes).digest('hex'),
              privateDirectory: run.state.privateEvidence.directory,
              file: `${name}.log`,
            },
          },
          null,
          2,
        ) + '\n',
      );
      assert.equal(
        output.includes('Synthetic-only-123!'),
        false,
        'unscanned child stdout/stderr must not leave the consumer boundary',
      );
      assert.equal(result.timedOut, false, `${name} probe itself must finish`);
      assert.equal(result.code, 1, `${name} must fail for its intended guard`);
      const artifacts = output.match(/Verification failed: (.+)/)?.[1];
      assert.ok(artifacts, `${name} must retain its run record`);
      const state = JSON.parse(await readFile(join(artifacts, 'run.json'), 'utf8'));
      const privateDirectory = join(dirname(state.work), state.privateEvidence.directory);
      assert.equal((await stat(privateDirectory)).mode & 0o777, 0o700);
      const failure = await readFile(join(privateDirectory, 'primary-error.log'), 'utf8');
      for (const log of state.privateEvidence.logs) {
        const raw = await readFile(join(privateDirectory, log.name));
        assert.equal(raw.length, log.bytes);
        assert.equal(createHash('sha256').update(raw).digest('hex'), log.sha256);
      }
      assert.equal(state.result, 'failed');
      assert.equal(state.cleanup, true);
      await assert.rejects(access(state.work));
      if (name === 'extra-payload') {
        assert.equal(state.extraPayloadProbe, 'node_modules/arbitrary.js');
        assert.match(failure, /payload beyond the candidate and declared pnpm shims/);
        assert.match(failure, /node_modules\/arbitrary.js/);
      } else if (name === 'artifact-scan' || name === 'runner-output-secret') {
        const desktop = join(artifacts, 'desktop');
        assert.deepEqual(await readdir(desktop), ['publication-failure.json']);
        const summary = JSON.parse(
          await readFile(join(desktop, 'publication-failure.json'), 'utf8'),
        );
        assert.equal(summary.publication, 'rejected');
        assert.equal(summary.rawArtifactsPublished, false);
        assert.equal(summary.primaryFailed, true);
        assert.equal(summary.cleanupFailures, 1);
        assert.equal(summary.scanFailed, true);
        assert.deepEqual(
          summary.errors.map((error) => error.phase),
          ['primary', 'cleanup', 'scan'],
        );
        for (const path of await readdir(artifacts, { recursive: true })) {
          if (/\.(json|log|txt|md)$/.test(path)) {
            assert.equal(
              (await readFile(join(artifacts, path), 'utf8')).includes('Synthetic-only-123!'),
              false,
            );
          }
        }
        assert.equal(summary.quarantine.retained, true);
        assert.equal(summary.quarantine.complete, true);
        const quarantine = join(dirname(state.work), summary.quarantine.directory);
        assert.equal((await stat(quarantine)).mode & 0o777, 0o700);
        if (name === 'artifact-scan') {
          const marker = await readFile(join(quarantine, 'raw/late-synthetic-marker.txt'), 'utf8');
          assert.equal(marker, 'Synthetic-only-123!');
        } else {
          const runnerLog = await readFile(join(quarantine, 'raw/runner.log'), 'utf8');
          for (const stream of ['stdout', 'stderr']) {
            assert.equal(
              runnerLog.includes(`runner-${stream}-secret=Synthetic-only-123!`),
              true,
              `real runner ${stream} injection must survive privately`,
            );
          }
          assert.equal(
            (await readdir(join(quarantine, 'raw'))).includes('late-synthetic-marker.txt'),
            false,
          );
        }
        const errorsBytes = await readFile(join(quarantine, 'errors.json'));
        assert.equal(
          createHash('sha256').update(errorsBytes).digest('hex'),
          summary.quarantine.errorsSHA256,
        );
        const errors = JSON.parse(errorsBytes);
        assert.deepEqual(
          errors.map((error) => error.phase),
          ['primary', 'cleanup', 'scan'],
        );
        assert.match(errors[0].error.message, /Auth consumer E2E exited 1/);
        assert.match(errors[0].error.cause.message, /故意错误的登录页面断言/);
        assert.match(errors[1].error.message, /Controlled Auth runtime cleanup failure/);
        assert.match(errors[2].error.message, /Sensitive synthetic value found/);
        const runtime = JSON.parse(await readFile(join(quarantine, 'raw/runtime.json'), 'utf8'));
        assert.deepEqual(runtime.listenersClosed, { auth: true, control: true });
        assert.match(runtime.primaryError, /Auth consumer E2E exited 1/);
        assert.match(runtime.cleanupError, /Controlled Auth runtime cleanup failure/);
        run.state.quarantines ??= [];
        run.state.quarantines.push({
          probe: name,
          directory: summary.quarantine.directory,
          errorsSHA256: summary.quarantine.errorsSHA256,
          retainedAfterWorkRemoval: true,
        });
        assert.match(failure, /artifact publication rejected/);
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
          assert.match(failure, /Auth consumer runner exceeded 15000 ms/);
          assert.match(failure, /Controlled Auth runtime cleanup failure/);
          assert.match(
            await readFile(join(desktop, 'runner.log'), 'utf8'),
            /hang after real browser navigation/,
          );
        }
      }
      for (const directory of [artifacts, run.artifacts]) {
        for (const path of await readdir(directory, { recursive: true })) {
          if (/\.(json|log|txt|md)$/.test(path)) {
            assert.equal(
              (await readFile(join(directory, path), 'utf8')).includes('Synthetic-only-123!'),
              false,
              'public consumer and harness evidence must exclude the injected credential',
            );
          }
        }
      }
      run.state.probes.push({
        name,
        artifacts,
        exitCode: result.code,
        cleanup: 'passed',
        privateOutputDirectory: state.privateEvidence.directory,
        publicMarkerAbsent: true,
        childOutputMarkerAbsent: true,
      });
      console.log(`${name}: intended failure and cleanup verified; ${artifacts}`);
    }
  },
  { privateOutput: true },
);
