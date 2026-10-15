import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, open, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { preview } from 'vite';
import { inspect } from 'node:util';

export async function serveBuild(dist) {
  await readFile(join(dist, 'index.html'));
  const server = await preview({
    configFile: false,
    root: dirname(dist),
    build: { outDir: basename(dist) },
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
    logLevel: 'error',
  });
  const address = server.httpServer.address();
  assert.ok(address && typeof address !== 'string');
  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      if (!server.httpServer.listening) return;
      const closed = new Promise((done, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : done())),
      );
      server.httpServer.closeAllConnections();
      await closed;
      assert.equal(server.httpServer.listening, false, 'preview listener must close');
    },
  };
}

function throwVerificationFailures(failures) {
  if (failures.length === 1) throw failures[0].error;
  if (failures.length > 1) {
    const error = new AggregateError(
      failures.map(({ error }) => error),
      'Verification operation and finalization failures',
    );
    error.phases = failures.map(({ phase }) => phase);
    throw error;
  }
}

export async function finalizePrivateLog(log, failures) {
  // Always attempt both operations, retaining their actual errors beside the caller's first cause.
  for (const phase of ['sync', 'close']) {
    try {
      await log[phase]();
    } catch (error) {
      failures.push({ phase, error });
    }
  }
  throwVerificationFailures(failures);
}

export async function verification(kind, action, { privateOutput = false } = {}) {
  await mkdir('.verification', { recursive: true });
  const work = await mkdtemp(resolve(`.verification/${kind}-`));
  const artifacts = resolve('artifacts/e2e', basename(work));
  await mkdir(artifacts, { recursive: true });
  const state = {
    kind,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    startedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    sourceDirty:
      execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
    lockSHA256: createHash('sha256')
      .update(await readFile('pnpm-lock.yaml'))
      .digest('hex'),
    work,
    artifacts,
    result: 'failed',
    cleanup: false,
  };
  // Auth consumers retain unreviewed process output outside both work cleanup and uploads.
  const privateArtifacts = privateOutput
    ? await mkdtemp(resolve(`.verification/${kind}-private-`))
    : undefined;
  if (privateArtifacts) state.privateEvidence = { directory: basename(privateArtifacts) };
  const retainError = async (phase, error) => {
    const raw = inspect(error, { depth: null, maxArrayLength: null, maxStringLength: null });
    const receipt = { phase, sha256: createHash('sha256').update(raw).digest('hex') };
    try {
      const file = await open(join(privateArtifacts, `${phase}-error.log`), 'wx', 0o600);
      const failures = [];
      try {
        await file.writeFile(raw);
      } catch (error) {
        failures.push({ phase: 'write', error });
      }
      await finalizePrivateLog(file, failures);
      receipt.retained = true;
    } catch (storageError) {
      state.privateWorkPreserved = true;
      receipt.retained = false;
      receipt.storageFailureSHA256 = createHash('sha256')
        .update(inspect(storageError))
        .digest('hex');
      // Keep the first cause and the new storage failure together in the fallback work.
      try {
        await writeFile(
          join(work, `${phase}-retention-error.log`),
          `${raw}\n\n${inspect(storageError)}`,
          { flag: 'wx', mode: 0o600 },
        );
        receipt.retainedInWork = true;
      } catch (fallbackError) {
        receipt.retainedInWork = false;
        receipt.fallbackFailureSHA256 = createHash('sha256')
          .update(inspect(fallbackError))
          .digest('hex');
      }
    }
    return receipt;
  };
  let child;
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
    if (child?.pid) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  const run = {
    work,
    artifacts,
    privateArtifacts,
    state,
    async command(command, args, { cwd = process.cwd(), env = process.env } = {}) {
      if (interrupted) throw new Error('Verification interrupted');
      const path = join(privateArtifacts || artifacts, `command-${run.step++}.log`);
      const log = privateOutput ? await open(path, 'wx', 0o600) : createWriteStream(path);
      let timer;
      const failures = [];
      try {
        if (privateOutput) await log.writeFile(`$ ${command} ${args.join(' ')}\n`);
        else log.write(`$ ${command} ${args.join(' ')}\n`);
        child = spawn(command, args, {
          cwd,
          env,
          stdio: privateOutput ? ['ignore', log.fd, log.fd] : ['ignore', 'pipe', 'pipe'],
          detached: true,
        });
        if (!privateOutput) {
          child.stdout.pipe(log, { end: false });
          child.stderr.pipe(log, { end: false });
          child.stdout.pipe(process.stdout);
          child.stderr.pipe(process.stderr);
        }
        const active = child;
        // A lost browser or package-manager process cannot keep CI alive indefinitely.
        timer = setTimeout(() => process.kill(-active.pid, 'SIGKILL'), 20 * 60_000);
        const code = await new Promise((done, reject) => {
          active.once('error', reject);
          active.once('close', (code, signal) =>
            signal ? reject(new Error(`${command} ended by ${signal}`)) : done(code),
          );
        });
        assert.equal(code, 0, `${command} exited ${code}; see ${artifacts}`);
        if (interrupted) throw new Error('Verification interrupted');
      } catch (error) {
        failures.push({ phase: 'primary', error });
      } finally {
        clearTimeout(timer);
        if (child?.pid) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch (error) {
            if (error.code !== 'ESRCH') failures.push({ phase: 'process-cleanup', error });
          }
        }
        child = undefined;
      }
      if (privateOutput) await finalizePrivateLog(log, failures);
      else {
        try {
          await new Promise((done) => log.end(done));
        } catch (error) {
          failures.push({ phase: 'close', error });
        }
        throwVerificationFailures(failures);
      }
    },
    step: 1,
  };
  try {
    await action(run);
    if (interrupted) throw new Error('Verification interrupted');
    state.result = 'passed';
  } catch (error) {
    state.error = privateOutput
      ? 'Verification action failed; original error retained privately'
      : error.stack;
    if (privateOutput) state.errorReceipt = await retainError('primary', error);
    process.exitCode = 1;
    if (!privateOutput) console.error(error);
  } finally {
    try {
      if (state.privateWorkPreserved) {
        state.result = 'failed';
        state.cleanup = false;
        state.privateWorkDisposition = 'retained after private evidence quarantine failure';
        process.exitCode = 1;
      } else {
        await rm(work, { recursive: true, force: true });
        state.cleanup = true;
      }
    } catch (error) {
      state.result = 'failed';
      state.cleanupError = privateOutput
        ? 'Verification cleanup failed; original error retained privately'
        : error.stack;
      if (privateOutput) state.cleanupErrorReceipt = await retainError('cleanup', error);
      process.exitCode = 1;
    }
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    state.finishedAt = new Date().toISOString();
    try {
      if (privateArtifacts) {
        state.privateEvidence.logs = [];
        for (const name of (await readdir(privateArtifacts)).sort()) {
          const bytes = await readFile(join(privateArtifacts, name));
          state.privateEvidence.logs.push({
            name,
            bytes: bytes.length,
            sha256: createHash('sha256').update(bytes).digest('hex'),
          });
        }
      }
      await writeFile(join(artifacts, 'run.json'), JSON.stringify(state, null, 2) + '\n');
    } catch (error) {
      if (!privateOutput) throw error;
      state.result = 'failed';
      await retainError('publication', error);
      process.exitCode = 1;
      console.error(
        'Verification receipt could not be published; original details retained privately',
      );
    }
    console.log(`Verification ${state.result}: ${artifacts}`);
  }
}

export async function waitForDetachedChild(child, timeoutMs, killGraceMs = 5_000) {
  for (const value of [timeoutMs, killGraceMs]) {
    assert.ok(Number.isSafeInteger(value) && value > 0 && value <= 2_147_483_647);
  }
  assert.ok(timeoutMs + 2 * killGraceMs <= 2_147_483_647);

  let timedOut = false;
  let killTimer;
  let deadlineTimer;
  let primaryError;
  let result;
  const signalGroup = (signal) => {
    if (!child.pid) return;
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  const closed = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code: code ?? 1, signal }));
  });
  const deadline = new Promise((_, reject) => {
    deadlineTimer = setTimeout(
      () => reject(new Error('Detached child did not close after process-group SIGKILL')),
      timeoutMs + 2 * killGraceMs,
    );
  });
  const timeoutTimer = setTimeout(() => {
    timedOut = true;
    try {
      signalGroup('SIGTERM');
      killTimer = setTimeout(() => {
        try {
          signalGroup('SIGKILL');
        } catch (error) {
          primaryError = error;
        }
      }, killGraceMs);
    } catch (error) {
      primaryError = error;
    }
  }, timeoutMs);
  try {
    result = await Promise.race([closed, deadline]);
  } catch (error) {
    primaryError = error;
  } finally {
    clearTimeout(timeoutTimer);
    clearTimeout(killTimer);
    clearTimeout(deadlineTimer);
  }
  try {
    signalGroup('SIGKILL');
    const end = Date.now() + killGraceMs;
    while (child.pid) {
      const states = execFileSync('ps', ['-axo', 'pgid=,stat='], {
        encoding: 'utf8',
        timeout: 1_000,
      });
      const alive = states.split('\n').some((line) => {
        const [group, state] = line.trim().split(/\s+/);
        return Number(group) === child.pid && !state.startsWith('Z');
      });
      if (!alive) break;
      if (Date.now() >= end)
        throw new Error('Detached process group cleanup exceeded its deadline');
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  } catch (cleanupError) {
    const errors = [
      ...(primaryError ? [primaryError] : []),
      ...(timedOut ? [new Error(`Detached child exceeded ${timeoutMs} ms`)] : []),
      cleanupError,
    ];
    throw new AggregateError(errors, errors.map((error) => error.stack).join('\n\n'));
  } finally {
    child.stdout?.destroy();
    child.stderr?.destroy();
    child.unref();
  }
  if (primaryError) throw primaryError;
  return { ...result, timedOut, cleanup: 'passed' };
}

export async function candidate(run, consume) {
  const lock = resolve('.verification/candidate.lock');
  await mkdir(lock); // Refuse concurrent builds instead of serving a torn candidate.
  try {
    await run.command('pnpm', ['--filter', '@cqu-moe/theme', 'build']);
    await run.command('pnpm', ['--filter', '@cqu-moe/ui', 'build']);
    return await consume();
  } finally {
    await rm(lock, { recursive: true });
  }
}

export async function snapshotPreview(run) {
  const dist = join(run.work, 'site/dist');
  await candidate(run, () =>
    run.command('pnpm', [
      '--filter',
      '@cqu-moe/preview',
      'build',
      '--outDir',
      dist,
      '--emptyOutDir',
    ]),
  );
  return dist;
}
