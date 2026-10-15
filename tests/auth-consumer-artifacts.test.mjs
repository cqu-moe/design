import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { publishAuthConsumerEvidence } from '../scripts/auth-consumer-artifacts.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fixture(action) {
  const root = await mkdtemp(join(tmpdir(), 'design-publication-'));
  try {
    const work = join(root, 'work');
    const source = join(work, 'pending');
    await mkdir(source, { recursive: true });
    await writeFile(join(source, 'marker.txt'), 'private-synthetic-marker');
    const failures = [
      { phase: 'primary', error: new Error('original-primary-cause') },
      { phase: 'cleanup', error: new Error('original-cleanup-cause') },
    ];
    await action({
      root,
      work,
      source,
      failures,
      destination: join(root, 'public'),
      quarantineParent: root,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const rejectMarker = async (directory) => {
  assert.equal(await readFile(join(directory, 'marker.txt'), 'utf8'), 'private-synthetic-marker');
  throw new Error('original-scan-cause');
};

test('scan rejection retains raw content and all original causes privately after work removal', async () => {
  await fixture(async (args) => {
    await publishAuthConsumerEvidence({ ...args, scan: rejectMarker });
    const summary = JSON.parse(
      await readFile(join(args.destination, 'publication-failure.json'), 'utf8'),
    );
    assert.equal(
      summary.quarantine?.retained,
      true,
      'scan rejection must retain a private quarantine',
    );
    const quarantine = join(args.root, summary.quarantine.directory);
    assert.equal((await stat(quarantine)).mode & 0o777, 0o700);
    await rm(args.work, { recursive: true, force: true });
    assert.equal(
      await readFile(join(quarantine, 'raw/marker.txt'), 'utf8'),
      'private-synthetic-marker',
    );
    const bytes = await readFile(join(quarantine, 'errors.json'));
    const errors = JSON.parse(bytes);
    assert.deepEqual(
      errors.map((x) => x.phase),
      ['primary', 'cleanup', 'scan'],
    );
    assert.deepEqual(
      errors.map((x) => x.error.message),
      ['original-primary-cause', 'original-cleanup-cause', 'original-scan-cause'],
    );
    assert.equal(hash(bytes), summary.quarantine.errorsSHA256);
    assert.equal(
      hash(await readFile(join(quarantine, 'receipt.json'))),
      summary.quarantine.receiptSHA256,
    );
    assert.deepEqual(await readdir(args.destination), ['publication-failure.json']);
    assert.doesNotMatch(JSON.stringify(summary), /private-synthetic-marker|original-.*-cause/);
  });
});

test('quarantine mkdir failure retains original causes and requests preservation of private work', async () => {
  await fixture(async (args) => {
    const blocker = join(args.root, 'not-a-directory');
    await writeFile(blocker, 'blocker');
    const result = await publishAuthConsumerEvidence({
      ...args,
      quarantineParent: blocker,
      scan: rejectMarker,
    });
    assert.equal(result.preserveWork, true);
    assert.deepEqual(
      result.errors.map((x) => x.phase),
      ['primary', 'cleanup', 'scan', 'quarantine'],
    );
    const errors = JSON.parse(
      await readFile(join(args.source, 'quarantine-failure-errors.json'), 'utf8'),
    );
    assert.equal(errors[0].error.message, 'original-primary-cause');
    assert.equal(errors[1].error.message, 'original-cleanup-cause');
    assert.equal(errors[2].error.message, 'original-scan-cause');
    assert.equal(errors[3].error.code, 'ENOTDIR');
    assert.doesNotMatch(JSON.stringify(result), /original-.*-cause/);
  });
});

test('publication mkdir failure retains its cause alongside primary and cleanup without replacing existing output', async () => {
  await fixture(async (args) => {
    await mkdir(args.destination);
    await writeFile(join(args.destination, 'existing.txt'), 'existing');
    const result = await publishAuthConsumerEvidence({ ...args, scan: async () => {} });
    assert.equal(result.published, false);
    assert.deepEqual(result.errors.map((x) => x.phase).slice(0, 3), [
      'primary',
      'cleanup',
      'publication',
    ]);
    assert.equal(result.quarantine.retained, true);
    const errors = JSON.parse(
      await readFile(join(args.root, result.quarantine.directory, 'errors.json'), 'utf8'),
    );
    assert.equal(errors[0].error.message, 'original-primary-cause');
    assert.equal(errors[1].error.message, 'original-cleanup-cause');
    assert.equal(errors[2].error.code, 'EEXIST');
    assert.equal(await readFile(join(args.destination, 'existing.txt'), 'utf8'), 'existing');
  });
});

test('verification honors an explicit preserve-work request and returns nonzero', async () => {
  const moduleURL = new URL('../scripts/verification-runtime.mjs', import.meta.url).href;
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import { verification } from ${JSON.stringify(moduleURL)};
    import { writeFile } from 'node:fs/promises';
    import { join } from 'node:path';
    let evidence;
    await verification('quarantine-retention-contract', async run => {
      await writeFile(join(run.work, 'private-cause.txt'), 'retained-original-cause');
      run.state.privateWorkPreserved = true;
      evidence = { work: run.work, artifacts: run.artifacts };
      throw new Error('Safe structural quarantine failure');
    });
    console.log('RETENTION_RECEIPT=' + JSON.stringify(evidence));
  `,
    ],
    { encoding: 'utf8' },
  );
  assert.equal(child.status, 1);
  const receipt = JSON.parse(child.stdout.match(/RETENTION_RECEIPT=(.+)/)[1]);
  try {
    const state = JSON.parse(await readFile(join(receipt.artifacts, 'run.json'), 'utf8'));
    assert.equal(state.result, 'failed');
    assert.equal(state.cleanup, false);
    assert.equal(state.privateWorkPreserved, true);
    assert.equal((await stat(receipt.work)).mode & 0o777, 0o700);
    assert.equal(
      await readFile(join(receipt.work, 'private-cause.txt'), 'utf8'),
      'retained-original-cause',
    );
  } finally {
    await rm(receipt.work, { recursive: true, force: true });
    await rm(receipt.artifacts, { recursive: true, force: true });
  }
});

test('private command output and original exception survive work cleanup without entering public receipts', async () => {
  const moduleURL = new URL('../scripts/verification-runtime.mjs', import.meta.url).href;
  const marker = 'unreviewed-command-and-error-marker';
  const child = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import { verification } from ${JSON.stringify(moduleURL)};
    let receipt;
    await verification('command-output-contract', async run => {
      receipt = { work: run.work, artifacts: run.artifacts, privateArtifacts: run.privateArtifacts };
      try {
        await run.command(process.execPath, ['--eval', ${JSON.stringify(`
          process.stdout.write('stdout:${marker}');
          process.stderr.write('stderr:${marker}');
          process.exit(7);
        `)}]);
      } catch (cause) { throw new Error(${JSON.stringify(marker)}, { cause }); }
    }, { privateOutput: true });
    console.log('OUTPUT_RECEIPT=' + JSON.stringify(receipt));
  `,
    ],
    { encoding: 'utf8' },
  );
  const receipt = JSON.parse(child.stdout.match(/OUTPUT_RECEIPT=(.+)/)[1]);
  try {
    assert.equal(child.status, 1);
    assert.equal(
      (child.stdout + child.stderr).includes(marker),
      false,
      'unreviewed command streams and original exception must not reach console',
    );
    await assert.rejects(stat(receipt.work));
    assert.equal((await stat(receipt.privateArtifacts)).mode & 0o777, 0o700);
    const state = JSON.parse(await readFile(join(receipt.artifacts, 'run.json'), 'utf8'));
    assert.equal(state.cleanup, true);
    assert.equal(state.errorReceipt.retained, true);
    assert.equal(JSON.stringify(state).includes(marker), false);
    assert.deepEqual(await readdir(receipt.artifacts), ['run.json']);
    const raw = await readFile(join(receipt.privateArtifacts, 'command-1.log'), 'utf8');
    assert.ok(raw.includes(`stdout:${marker}`));
    assert.ok(raw.includes(`stderr:${marker}`));
    const error = await readFile(join(receipt.privateArtifacts, 'primary-error.log'), 'utf8');
    assert.ok(error.includes(marker));
    assert.match(error, /exited 7/);
    assert.equal(hash(error), state.errorReceipt.sha256);
    for (const log of state.privateEvidence.logs) {
      const file = join(receipt.privateArtifacts, log.name);
      assert.equal((await stat(file)).mode & 0o777, 0o600);
      assert.equal(hash(await readFile(file)), log.sha256);
    }
  } finally {
    await rm(receipt.work, { recursive: true, force: true });
    await rm(receipt.artifacts, { recursive: true, force: true });
    if (receipt.privateArtifacts)
      await rm(receipt.privateArtifacts, { recursive: true, force: true });
  }
});

for (const caller of ['command', 'harness']) {
  test(`${caller} retains the real child failure plus sync and close failures privately`, async () => {
    const evidence = await mkdtemp(join(process.cwd(), '.verification/log-finalization-'));
    const preload = join(evidence, 'io-fault.cjs');
    await writeFile(
      preload,
      `
const fs = require('node:fs/promises');
const cp = require('node:child_process');
const { basename, join } = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const originalOpen = fs.open;
fs.open = async function(path, ...args) {
  const file = await originalOpen.call(this, path, ...args);
  if (basename(path) === ${JSON.stringify(caller === 'command' ? 'command-1.log' : 'extra-payload.log')}) {
    const sync = file.sync.bind(file);
    const close = file.close.bind(file);
    file.sync = async () => {
      await sync();
      await fs.writeFile(join(__dirname, 'sync-completed.json'), 'true', { mode: 0o600 });
      throw Object.assign(new Error('private-original-sync-failure'), { code: 'EIO_SYNC' });
    };
    file.close = async () => {
      await close();
      await fs.writeFile(join(__dirname, 'close-completed.json'), JSON.stringify({ fd: file.fd }), { mode: 0o600 });
      throw Object.assign(new Error('private-original-close-failure'), { code: 'EIO_CLOSE' });
    };
  }
  return file;
};
const originalSpawn = cp.spawn;
cp.spawn = function(command, args, options) {
  if (args?.includes('scripts/verify-auth-consumer.mjs')) command = join(__dirname, 'missing-consumer-executable');
  return originalSpawn.call(this, command, args, options);
};
syncBuiltinESMExports();
`,
      { flag: 'wx', mode: 0o600 },
    );
    const moduleURL = new URL('../scripts/verification-runtime.mjs', import.meta.url).href;
    const args =
      caller === 'command'
        ? [
            '--input-type=module',
            '--eval',
            `
      import { verification } from ${JSON.stringify(moduleURL)};
      await verification('log-finalization-command', async run => {
        await run.command(process.execPath, ['--eval', 'process.exit(7)']);
      }, { privateOutput: true });
    `,
          ]
        : ['scripts/verify-auth-consumer-harness.mjs', '--probe', 'extra-payload'];
    // Inject only filesystem rejection and an actual missing executable; never stub the owners.
    const child = spawnSync(process.execPath, ['--require', preload, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DESIGN_CANDIDATE_PACKAGES: join(process.cwd(), 'artifacts/candidate'),
      },
    });
    await writeFile(join(evidence, 'stdout.log'), child.stdout, { mode: 0o600 });
    await writeFile(join(evidence, 'stderr.log'), child.stderr, { mode: 0o600 });
    assert.equal(child.status, 1);
    const artifacts = child.stdout.match(/Verification failed: (.+)/)?.[1];
    assert.ok(artifacts, 'real caller must finish with a structured failure record');
    const state = JSON.parse(await readFile(join(artifacts, 'run.json'), 'utf8'));
    const privateDirectory = join(process.cwd(), '.verification', state.privateEvidence.directory);
    const original = await readFile(join(privateDirectory, 'primary-error.log'), 'utf8');
    const primaryRetained =
      caller === 'command'
        ? original.includes('exited 7')
        : original.includes('ENOENT') && original.includes('missing-consumer-executable');
    const receipt = {
      caller,
      exitCode: child.status,
      artifacts,
      privateDirectory,
      workRemoved: !(await stat(state.work).then(
        () => true,
        () => false,
      )),
      primaryRetained,
      syncRetained:
        original.includes('private-original-sync-failure') && original.includes('EIO_SYNC'),
      closeRetained:
        original.includes('private-original-close-failure') && original.includes('EIO_CLOSE'),
      actualSyncCompleted: JSON.parse(
        await readFile(join(evidence, 'sync-completed.json'), 'utf8'),
      ),
      actualCloseFD: JSON.parse(await readFile(join(evidence, 'close-completed.json'), 'utf8')).fd,
      errorSHA256: hash(original),
    };
    // This control deliberately keeps its raw caller/journal evidence for independent review.
    await writeFile(join(evidence, 'result.json'), JSON.stringify(receipt, null, 2) + '\n', {
      mode: 0o600,
    });
    assert.equal(state.cleanup, true);
    assert.equal(receipt.workRemoved, true);
    assert.equal(receipt.actualSyncCompleted, true);
    assert.equal(receipt.actualCloseFD, -1, 'close still runs after sync rejects');
    assert.equal(receipt.errorSHA256, state.errorReceipt.sha256);
    assert.equal((await stat(privateDirectory)).mode & 0o777, 0o700);
    assert.equal((await stat(join(privateDirectory, 'primary-error.log'))).mode & 0o777, 0o600);
    for (const content of [
      child.stdout,
      child.stderr,
      await readFile(join(artifacts, 'run.json'), 'utf8'),
    ]) {
      assert.equal(
        /private-original-(?:sync|close)-failure|missing-consumer-executable/.test(content),
        false,
        'public receipt and console must exclude unknown original error messages',
      );
    }
    assert.equal(
      receipt.primaryRetained,
      true,
      'original child failure must survive log finalization',
    );
    assert.equal(receipt.syncRetained, true, 'original sync failure must survive close failure');
    assert.equal(receipt.closeRetained, true);
  });
}
