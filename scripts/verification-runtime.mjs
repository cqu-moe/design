import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { preview } from 'vite';

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

export async function verification(kind, action) {
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
    state,
    async command(command, args, { cwd = process.cwd(), env = process.env } = {}) {
      if (interrupted) throw new Error('Verification interrupted');
      const log = createWriteStream(join(artifacts, `command-${run.step++}.log`));
      log.write(`$ ${command} ${args.join(' ')}\n`);
      let timer;
      try {
        child = spawn(command, args, {
          cwd,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: true,
        });
        child.stdout.pipe(log, { end: false });
        child.stderr.pipe(log, { end: false });
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
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
      } finally {
        clearTimeout(timer);
        if (child?.pid) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch (error) {
            if (error.code !== 'ESRCH') throw error;
          }
        }
        child = undefined;
        await new Promise((done) => log.end(done));
      }
    },
    step: 1,
  };
  try {
    await action(run);
    if (interrupted) throw new Error('Verification interrupted');
    state.result = 'passed';
  } catch (error) {
    state.error = error.stack;
    process.exitCode = 1;
    console.error(error);
  } finally {
    try {
      await rm(work, { recursive: true, force: true });
      state.cleanup = true;
    } catch (error) {
      state.result = 'failed';
      state.cleanupError = error.stack;
      process.exitCode = 1;
    }
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
    state.finishedAt = new Date().toISOString();
    await writeFile(join(artifacts, 'run.json'), JSON.stringify(state, null, 2) + '\n');
    console.log(`Verification ${state.result}: ${artifacts}`);
  }
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
