import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { waitForDetachedChild } from '../scripts/verification-runtime.mjs';

for (const leaderExits of [false, true]) {
  test(`timeout closes a stubborn descendant listener when leader ${leaderExits ? 'exits on' : 'ignores'} SIGTERM`, async () => {
    const descendantSource = `
      const { createServer } = require('node:http');
      process.on('SIGTERM', () => {});
      const server = createServer((_, response) => response.end('synthetic child'));
      server.listen(0, '127.0.0.1', () => {
        console.log(JSON.stringify({ pid: process.pid, port: server.address().port }));
      });
    `;
    const leaderSource = `
      const { spawn } = require('node:child_process');
      spawn(process.execPath, ['-e', ${JSON.stringify(descendantSource)}], { stdio: ['ignore', 'inherit', 'inherit'] });
      process.on('SIGTERM', () => { ${leaderExits ? 'process.exit(0);' : ''} });
      setInterval(() => {}, 1000);
    `;
    const child = spawn(process.execPath, ['-e', leaderSource], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    let readinessTimer;
    try {
      const [data] = await Promise.race([
        once(child.stdout, 'data'),
        new Promise((_, reject) => {
          readinessTimer = setTimeout(
            () => reject(new Error('Synthetic child did not listen')),
            5_000,
          );
        }),
      ]);
      clearTimeout(readinessTimer);
      const descendant = JSON.parse(data.toString());
      const url = `http://127.0.0.1:${descendant.port}`;
      assert.equal(await (await fetch(url)).text(), 'synthetic child');
      const started = Date.now();
      const result = await waitForDetachedChild(child, 100, 500);

      assert.equal(result.timedOut, true);
      assert.equal(result.cleanup, 'passed');
      assert.ok(Date.now() - started < 5_000, 'cleanup must be bounded');
      await assert.rejects(fetch(url));
      const states = execFileSync('ps', ['-axo', 'pid=,stat='], { encoding: 'utf8' });
      assert.equal(
        states.split('\n').some((line) => {
          const [pid, state] = line.trim().split(/\s+/);
          return Number(pid) === descendant.pid && !state.startsWith('Z');
        }),
        false,
        'descendant must no longer execute',
      );
    } finally {
      clearTimeout(readinessTimer);
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
      child.stdout.destroy();
      child.stderr.destroy();
    }
  });
}
