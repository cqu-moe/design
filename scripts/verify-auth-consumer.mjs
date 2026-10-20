import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { cp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { installCandidatePackages, verifyCandidatePackages } from './candidate-packages.mjs';
import { verification, waitForDetachedChild } from './verification-runtime.mjs';
import { publishAuthConsumerEvidence } from './auth-consumer-artifacts.mjs';

process.umask(0o077);

const AUTH_COMMIT = 'd9bf0c5e6d5cc459029da6a345991b8d0f13f514';
const AUTH_REPOSITORY = process.env.AUTH_E2E_REPOSITORY || 'https://github.com/cqu-moe/auth.git';
const AUTH_PASSWORD = 'Synthetic-only-123!';
const candidateDir = process.env.DESIGN_CANDIDATE_PACKAGES;

if (!candidateDir) {
  throw new Error(
    'DESIGN_CANDIDATE_PACKAGES is required: verify the source-job candidate artifact instead of repacking silently',
  );
}

const browserIndex = process.argv.indexOf('--browser');
const browserName = browserIndex < 0 ? 'chromium' : process.argv[browserIndex + 1];
if (
  !['chromium', 'firefox', 'webkit'].includes(browserName) ||
  process.argv.filter((arg) => arg === '--browser').length > 1
) {
  throw new Error(
    'Usage: node scripts/verify-auth-consumer.mjs [--browser chromium|firefox|webkit] [--variant desktop|mobile]',
  );
}

const variants = process.argv.includes('--variant')
  ? [process.argv[process.argv.indexOf('--variant') + 1]]
  : ['desktop', 'mobile'];
if (variants.some((variant) => !['desktop', 'mobile'].includes(variant))) {
  throw new Error('Usage: node scripts/verify-auth-consumer.mjs [--variant desktop|mobile]');
}

function commandEnv(extra = {}) {
  return {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    CI: process.env.CI,
    DO_NOT_TRACK: '1',
    E2E_TELEMETRY_DISABLED: '1',
    WRANGLER_SEND_METRICS: 'false',
    ...extra,
  };
}

async function removeOldTarballs(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.tgz')) await rm(join(directory, entry.name));
  }
}

async function publishedFiles(directory) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(relative(directory, path));
      else throw new Error(`Unexpected non-file published payload entry: ${path}`);
    }
  }
  await walk(directory);
  return files.sort();
}

async function verifyPnpmAddedFiles(auth, name, candidatePackage, installedPackage, addedFiles) {
  if (name === 'theme') {
    assert.deepEqual(
      addedFiles,
      [],
      'pnpm has no metadata basis to add files inside the installed theme package',
    );
    return [];
  }

  const candidateManifest = JSON.parse(await readFile(join(candidatePackage, 'package.json')));
  assert.deepEqual(
    candidateManifest.peerDependencies?.typescript,
    '>=5.9 <8',
    'UI candidate no longer declares the TypeScript peer that explains pnpm shims',
  );
  assert.deepEqual(
    candidateManifest.peerDependenciesMeta?.typescript,
    { optional: true },
    'UI candidate TypeScript peer must remain optional pnpm shim metadata',
  );
  const frontend = join(auth, 'frontend');
  const typescriptManifest = JSON.parse(
    await readFile(join(frontend, 'node_modules', 'typescript', 'package.json')),
  );
  assert.equal(typescriptManifest.version, '5.9.3');
  assert.deepEqual(typescriptManifest.bin, {
    tsc: './bin/tsc',
    tsserver: './bin/tsserver',
  });
  const typescriptPackage = await realpath(join(frontend, 'node_modules', 'typescript'));
  const expectedFiles = Object.keys(typescriptManifest.bin)
    .sort()
    .map((bin) => `node_modules/.bin/${bin}`);
  assert.deepEqual(
    addedFiles,
    expectedFiles,
    `Installed @cqu-moe/${name} has payload beyond the candidate and declared pnpm shims`,
  );

  const verified = [];
  for (const [bin, targetPath] of Object.entries(typescriptManifest.bin)) {
    const file = `node_modules/.bin/${bin}`;
    const binDir = await realpath(join(installedPackage, 'node_modules', '.bin'));
    const target = join(typescriptPackage, targetPath);
    const bytes = await readFile(join(installedPackage, file));
    const referenceBinDir = join(frontend, 'node_modules', '.bin');
    const referenceTarget = join(frontend, 'node_modules', 'typescript', targetPath);
    const reference = await readFile(join(referenceBinDir, bin), 'utf8');
    assert.ok(reference.endsWith(`# cmd-shim-target=${referenceTarget}\n`));
    // Compare the installer's own shim; only its location-dependent target changes.
    const expected = Buffer.from(
      reference
        .replaceAll(relative(referenceBinDir, referenceTarget), relative(binDir, target))
        .replaceAll(`# cmd-shim-target=${referenceTarget}`, `# cmd-shim-target=${target}`),
    );
    assert.ok(
      bytes.equals(expected),
      `pnpm-injected ${file} does not match its TypeScript bin metadata shim`,
    );
    verified.push({
      file,
      target,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  return verified;
}

async function packageFacts(auth, expectedVersions, candidateInspections) {
  const facts = {};
  for (const name of ['theme', 'ui']) {
    const version = expectedVersions[name];
    const filename = `cqu-moe-${name}-${version}.tgz`;
    const bytes = await readFile(join(auth, 'frontend', '.design', filename));
    const candidatePackage = join(candidateInspections[name], 'package');
    const installedPackage = join(auth, 'frontend', 'node_modules', '@cqu-moe', name);
    const candidateFiles = await publishedFiles(candidatePackage);
    const installedFiles = await publishedFiles(installedPackage);
    const packageManagerAddedFiles = await verifyPnpmAddedFiles(
      auth,
      name,
      candidatePackage,
      installedPackage,
      installedFiles.filter((file) => file.startsWith('node_modules/')),
    );
    const allowedAddedFiles = new Set(packageManagerAddedFiles.map((entry) => entry.file));
    const installedPublicationFiles = installedFiles.filter((file) => !allowedAddedFiles.has(file));
    assert.deepEqual(
      installedPublicationFiles,
      candidateFiles,
      `Installed @cqu-moe/${name} payload file set differs from the candidate tarball`,
    );
    const payload = [];
    for (const file of candidateFiles) {
      const candidateBytes = await readFile(join(candidatePackage, file));
      const installedBytes = await readFile(join(installedPackage, file));
      const candidateSHA256 = createHash('sha256').update(candidateBytes).digest('hex');
      const installedSHA256 = createHash('sha256').update(installedBytes).digest('hex');
      assert.equal(
        installedSHA256,
        candidateSHA256,
        `Installed @cqu-moe/${name} payload does not match candidate: ${file}`,
      );
      payload.push({ file, candidateSHA256, installedSHA256 });
    }
    const installed = JSON.parse(await readFile(join(installedPackage, 'package.json')));
    assert.ok(payload.length > 0, `Candidate @cqu-moe/${name} tarball has no publishable files`);
    facts[name] = {
      version,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      installedVersion: installed.version,
      payloadFileCount: payload.length,
      payloadMatchesCandidate: true,
      packageManagerAddedFiles,
      payload,
    };
  }
  return facts;
}

async function synchronizeCandidateLockfile(auth, expectedVersions) {
  const frontend = join(auth, 'frontend');
  const manifestPath = join(frontend, 'package.json');
  const workspacePath = join(frontend, 'pnpm-workspace.yaml');
  const lockPath = join(frontend, 'pnpm-lock.yaml');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  let workspace = await readFile(workspacePath, 'utf8');
  let lock = await readFile(lockPath, 'utf8');
  for (const name of ['theme', 'ui']) {
    const previous = manifest.dependencies[`@cqu-moe/${name}`];
    const match = new RegExp(`^file:\\.design/(cqu-moe-${name}-(.+)\\.tgz)$`).exec(previous);
    assert.ok(match, `Pinned Auth has an unexpected ${name} dependency`);
    const [, previousFilename, previousVersion] = match;
    const filename = `cqu-moe-${name}-${expectedVersions[name]}.tgz`;
    // Move only the two pinned package references; keep every other dependency frozen.
    manifest.dependencies[`@cqu-moe/${name}`] = `file:.design/${filename}`;
    lock = lock.replaceAll(previousFilename, filename);
    if (name === 'theme') {
      assert.ok(workspace.includes(previousFilename), 'Pinned Auth theme override is missing');
      workspace = workspace.replaceAll(previousFilename, filename);
    }
    const marker = `  '@cqu-moe/${name}@file:.design/${filename}':`;
    const resolution = '    resolution: {integrity: sha512-';
    const markerIndex = lock.indexOf(marker);
    assert.ok(markerIndex >= 0, `Auth lockfile is missing candidate ${name}`);
    const resolutionIndex = lock.indexOf(resolution, markerIndex);
    assert.ok(resolutionIndex >= 0, `Auth lockfile is missing ${name} integrity`);
    const valueStart = resolutionIndex + resolution.length;
    const valueEnd = lock.indexOf(',', valueStart);
    assert.ok(valueEnd > valueStart, `Auth lockfile has malformed ${name} integrity`);
    const bytes = await readFile(join(auth, 'frontend', '.design', filename));
    const integrity = createHash('sha512').update(bytes).digest('base64');
    lock = lock.slice(0, valueStart) + integrity + lock.slice(valueEnd);
    const entryEnd = lock.indexOf('\n\n', markerIndex);
    assert.ok(entryEnd > markerIndex, `Auth lockfile has malformed ${name} entry`);
    const entry = lock.slice(markerIndex, entryEnd);
    assert.equal(entry.match(/\n    version: ([^\n]+)/)?.[1], previousVersion);
    lock =
      lock.slice(0, markerIndex) +
      entry.replace(
        `\n    version: ${previousVersion}`,
        `\n    version: ${expectedVersions[name]}`,
      ) +
      lock.slice(entryEnd);
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(workspacePath, workspace);
  await writeFile(lockPath, lock);
}

async function writeGeneratedSuite(auth) {
  const directory = join(auth, '.e2e', 'design-consumer');
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, 'consumer-engine.mjs'),
    `import { surfaceOf, web } from '@e2e-dev/web';

// Config and test are loaded in separate module graphs in e2e 0.21.
const holder = globalThis;
export const consumerEngine = holder.designAuthConsumerEngine ??= web({
  browser: '${browserName}',
  viewport: process.env.AUTH_E2E_MOBILE
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 },
});
export const consumerContext = () => surfaceOf(consumerEngine).context();
`,
  );
  await writeFile(
    join(directory, 'e2e.config.ts'),
    `import type { E2EConfig } from 'e2e';
import { consumerEngine } from './consumer-engine.mjs';

const credentials = {
  design: {
    username: process.env.AUTH_CONSUMER_EMAIL!,
    password: process.env.AUTH_CONSUMER_PASSWORD!,
  },
};

export default {
  tests: ['./design-consumer.e2e.ts'],
  workers: 1,
  retries: 0,
  timeout: 120000,
  assertionTimeout: 10000,
  output: process.env.AUTH_E2E_OUTPUT!,
  credentials,
  secrets: { password: async () => credentials.design.password },
  targets: [{
    name: '${browserName}-' + (process.env.AUTH_E2E_MOBILE ? 'mobile' : 'desktop'),
    engine: consumerEngine,
    app: { url: process.env.AUTH_E2E_URL },
  }],
} satisfies E2EConfig;
`,
  );
  await writeFile(
    join(directory, 'design-consumer.e2e.ts'),
    `import { test, beforeEach, afterEach } from '@e2e-dev/web';
import { expect, credentials, secrets } from 'e2e';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { consumerContext } from './consumer-engine.mjs';
let unexpected: string[];

beforeEach(async ({ app, browser }) => {
  unexpected = [];
  const allowed = new URL(process.env.AUTH_E2E_URL!).origin;
  await browser.route('**/*', async route => {
    const origin = new URL(route.request.url).origin;
    if (origin !== allowed) {
      unexpected.push(origin);
      await route.abort();
    } else {
      await route.continue();
    }
  });
  // The engine is lazy: open a script-free JSON response before taking its live context.
  await app.open('/api/v1/auth/get-session');
  expect(await browser.evaluate(() => document.contentType)).toBe('application/json');
  const context = consumerContext();
  const nativeBrowser = context.browser()!;
  const actualBrowser = nativeBrowser.browserType().name();
  const version = nativeBrowser.version();
  const viewport = await browser.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const expectedViewport = process.env.AUTH_E2E_MOBILE
    ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  expect(actualBrowser).toBe('${browserName}');
  expect(version.length > 0).toBe(true);
  expect(viewport).toEqual(expectedViewport);
  await writeFile(join(process.env.AUTH_E2E_OUTPUT!, 'browser.json'), JSON.stringify({
    requested: '${browserName}', actual: actualBrowser, version, viewport,
  }, null, 2));
  await context.routeWebSocket('**/*', socket => {
    unexpected.push(new URL(socket.url()).origin);
    socket.close({ code: 1008, reason: 'Unexpected network dependency' });
  });
});

afterEach(async () => {
  expect(unexpected).toEqual([]);
});

test('save, reload, survive a real unauthorized save, and restore a profile setting', async ({
  app,
  screen,
  browser,
}) => {
  const account = credentials.user('design');
  const password = await secrets.get('password');
  const variant = process.env.AUTH_E2E_MOBILE ? 'mobile' : 'desktop';
  await app.open('/login');
  await app.screenshot('auth-consumer-login-${browserName}-' + variant);
  if (process.env.DESIGN_AUTH_PROBE_WEBSOCKET === '1') {
    const outcome = await browser.evaluate((url: string) => new Promise(resolve => {
      const socket = new WebSocket(url);
      socket.onerror = () => {};
      socket.onclose = event => resolve({ code: event.code, reason: event.reason });
    }), process.env.AUTH_CONSUMER_WEBSOCKET_URL!);
    await writeFile(join(process.env.AUTH_E2E_OUTPUT!, 'websocket-probe.json'), JSON.stringify(outcome));
    return;
  }
  if (process.env.DESIGN_AUTH_PROBE_TIMEOUT === '1') {
    console.log('Controlled Auth consumer runner hang after real browser navigation');
    await new Promise(() => {});
  }
  if (process.env.DESIGN_AUTH_BREAK_ASSERTION === '1') {
    await expect(screen.getByRole('heading', '欢迎回来', { exact: true }))
      .toHaveText('故意错误的登录页面断言');
  }
  await screen.getByLabel('邮箱', { exact: true }).fill(account.username);
  await browser.locator('#password').fill(password);
  await screen.getByRole('button', '登录', { exact: true }).click();
  await expect(browser).toHaveURL(/\\/settings$/);
  await expect(screen.getByText('Synthetic Consumer', { exact: true })).toBeVisible();
  await screen.getByRole('button', '修改昵称', { exact: true }).click();
  await screen.getByLabel('昵称', { exact: true }).fill('   ');
  await screen.getByRole('button', '保存', { exact: true }).click();
  await expect(browser.locator('#display-name-error')).toHaveText('请输入昵称');
  await expect(screen.getByText('昵称已更新', { exact: true })).not.toBeVisible();

  await screen.getByLabel('昵称', { exact: true }).fill('候选包消费者');
  await screen.getByRole('button', '保存', { exact: true }).click();
  await expect(screen.getByText('昵称已更新', { exact: true })).toBeVisible();
  await browser.reload();
  await expect(screen.getByText('候选包消费者', { exact: true })).toBeVisible();
  await expect(await browser.evaluate(async () => {
    const session = await (await fetch('/api/v1/auth/get-session')).json();
    return { email: session?.user?.email, name: session?.user?.name };
  })).toEqual({ email: account.username, name: '候选包消费者' });

  await screen.getByRole('button', '修改昵称', { exact: true }).click();
  await screen.getByLabel('昵称', { exact: true }).fill('不能假保存的昵称');
  const signOut = await browser.evaluate(async () =>
    (await fetch('/api/v1/auth/sign-out', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })).status,
  );
  expect(signOut).toBe(200);
  const failedSave = browser.waitForResponse(/\\/api\\/v1\\/auth\\/update-user/);
  await screen.getByRole('button', '保存', { exact: true }).click();
  const failure = await failedSave;
  expect(failure.status).toBe(401);
  await expect(browser.locator('#display-name-error')).toBeVisible();
  expect(((await browser.locator('#display-name-error').textContent()) ?? '').trim()).not.toBe('');
  await expect(screen.getByText('昵称已更新', { exact: true })).not.toBeVisible();
  expect(await browser.locator('#displayName').inputValue()).toBe('不能假保存的昵称');

  await app.open('/login');
  await screen.getByLabel('邮箱', { exact: true }).fill(account.username);
  await browser.locator('#password').fill(password);
  await screen.getByRole('button', '登录', { exact: true }).click();
  await expect(browser).toHaveURL(/\\/settings$/);
  await expect(screen.getByText('候选包消费者', { exact: true })).toBeVisible();
  await screen.getByRole('button', '修改昵称', { exact: true }).click();
  await screen.getByLabel('昵称', { exact: true }).fill('Synthetic Consumer');
  await screen.getByRole('button', '保存', { exact: true }).click();
  await expect(screen.getByText('昵称已更新', { exact: true })).toBeVisible();
  await browser.reload();
  await expect(screen.getByText('Synthetic Consumer', { exact: true })).toBeVisible();
  await expect(await browser.evaluate(async () => {
    const session = await (await fetch('/api/v1/auth/get-session')).json();
    return { email: session?.user?.email, name: session?.user?.name };
  })).toEqual({ email: account.username, name: 'Synthetic Consumer' });
});
`,
  );
}

async function runE2e(auth, output, variant) {
  const log = [];
  let websocket;
  let connections = 0;
  if (process.env.DESIGN_AUTH_PROBE_WEBSOCKET === '1') {
    const { WebSocketServer } = createRequire(join(auth, 'package.json'))('ws');
    websocket = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    await new Promise((resolve, reject) => {
      websocket.once('listening', resolve);
      websocket.once('error', reject);
    });
    websocket.on('connection', (socket) => {
      connections++;
      socket.close(1000, 'Synthetic unplanned WebSocket');
    });
  }
  const child = spawn(
    process.execPath,
    ['node_modules/e2e/dist/cli/bin.js', 'run', '--config', '.e2e/design-consumer/e2e.config.ts'],
    {
      cwd: auth,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: commandEnv({
        AUTH_E2E_URL: process.env.AUTH_E2E_URL,
        AUTH_E2E_CONTROL: process.env.AUTH_E2E_CONTROL,
        AUTH_E2E_MOBILE: variant === 'mobile' ? '1' : '',
        AUTH_E2E_OUTPUT: output,
        AUTH_CONSUMER_EMAIL: process.env.AUTH_CONSUMER_EMAIL,
        AUTH_CONSUMER_PASSWORD: process.env.AUTH_CONSUMER_PASSWORD,
        DESIGN_AUTH_BREAK_ASSERTION: process.env.DESIGN_AUTH_BREAK_ASSERTION || '',
        DESIGN_AUTH_PROBE_WEBSOCKET: process.env.DESIGN_AUTH_PROBE_WEBSOCKET || '',
        DESIGN_AUTH_PROBE_TIMEOUT: process.env.DESIGN_AUTH_PROBE_TIMEOUT || '',
        AUTH_CONSUMER_WEBSOCKET_URL: websocket
          ? `ws://127.0.0.1:${websocket.address().port}/synthetic-probe`
          : '',
      }),
    },
  );
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      log.push(chunk);
    });
  }
  const timeoutMs = process.env.DESIGN_AUTH_PROBE_TIMEOUT === '1' ? 15_000 : 10 * 60_000;
  let result;
  let primaryError;
  const cleanupErrors = [];
  try {
    result = await waitForDetachedChild(child, timeoutMs);
    if (result.timedOut) throw new Error(`Auth consumer runner exceeded ${timeoutMs} ms`);
  } catch (error) {
    primaryError = error;
  } finally {
    if (websocket) {
      try {
        for (const socket of websocket.clients) socket.terminate();
        await new Promise((resolve, reject) =>
          websocket.close((error) => (error ? reject(error) : resolve())),
        );
        await writeFile(
          join(output, 'websocket-server.json'),
          JSON.stringify({ connections, closed: true }),
        );
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      await writeFile(join(output, 'runner.log'), Buffer.concat(log));
      await writeFile(
        join(output, 'runner.json'),
        JSON.stringify(
          {
            pid: child.pid,
            timeoutMs,
            ...result,
            error: primaryError?.stack,
            cleanupErrors: cleanupErrors.map((error) => error.stack),
          },
          null,
          2,
        ) + '\n',
      );
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length)
    throw new AggregateError(
      [...(primaryError ? [primaryError] : []), ...cleanupErrors],
      [primaryError, ...cleanupErrors]
        .filter(Boolean)
        .map((error) => error.stack)
        .join('\n\n'),
    );
  if (primaryError) throw primaryError;
  return result.code;
}

await verification(
  'auth-consumer',
  async (run) => {
    const auth = join(run.work, 'auth');
    const expectedVersions = {};
    for (const name of ['theme', 'ui']) {
      const pkg = JSON.parse(await readFile(join('packages', name, 'package.json'), 'utf8'));
      expectedVersions[name] = pkg.version;
    }
    const verifiedCandidate = await verifyCandidatePackages(candidateDir, expectedVersions);
    run.state.browser = browserName;
    run.state.packageSource = 'candidate-artifact';
    run.state.candidateSHA256 = verifiedCandidate.sha256;
    const candidateInspections = {};
    const env = commandEnv();
    for (const name of ['theme', 'ui']) {
      const filename = `cqu-moe-${name}-${expectedVersions[name]}.tgz`;
      candidateInspections[name] = join(run.work, 'candidate-inspection', name);
      await mkdir(candidateInspections[name], { recursive: true });
      await run.command('tar', [
        '-xf',
        join(verifiedCandidate.source, filename),
        '-C',
        candidateInspections[name],
      ]);
    }
    await run.command('git', ['clone', AUTH_REPOSITORY, auth], { env });
    await run.command('git', ['-C', auth, 'checkout', '--detach', AUTH_COMMIT], { env });
    const clonedCommit = execFileSync('git', ['-C', auth, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      env,
    }).trim();
    if (clonedCommit !== AUTH_COMMIT) throw new Error('Auth checkout commit drifted');
    run.state.auth = {
      repository: AUTH_REPOSITORY,
      commit: clonedCommit,
      sourceClean:
        execFileSync('git', ['-C', auth, 'status', '--porcelain'], {
          encoding: 'utf8',
          env,
        }).trim().length === 0,
    };

    await run.command('npm', ['ci'], { cwd: auth, env });
    await removeOldTarballs(join(auth, 'frontend', '.design'));
    await installCandidatePackages(
      candidateDir,
      join(auth, 'frontend', '.design'),
      expectedVersions,
    );
    await synchronizeCandidateLockfile(auth, expectedVersions);
    run.state.authLockSynchronizedForCandidate = true;
    await run.command('pnpm', ['--dir', 'frontend', 'install', '--frozen-lockfile'], {
      cwd: auth,
      env,
    });
    if (process.env.DESIGN_AUTH_BREAK_PAYLOAD === '1') {
      const installedPayload = join(
        auth,
        'frontend',
        'node_modules',
        '@cqu-moe',
        'ui',
        'dist',
        'index.js',
      );
      const bytes = await readFile(installedPayload);
      bytes[0] ^= 0xff;
      await writeFile(installedPayload, bytes);
    }
    if (process.env.DESIGN_AUTH_EXTRA_PAYLOAD === '1') {
      const extra = join(auth, 'frontend/node_modules/@cqu-moe/ui/node_modules/arbitrary.js');
      await mkdir(dirname(extra), { recursive: true });
      await writeFile(extra, 'export const unexpectedPayload = true;\n');
      run.state.extraPayloadProbe = 'node_modules/arbitrary.js';
    }
    await cp(
      join(auth, 'frontend', 'pnpm-lock.yaml'),
      join(run.artifacts, 'auth-consumer-lock.yaml'),
    );
    run.state.packages = await packageFacts(auth, expectedVersions, candidateInspections);
    for (const name of ['theme', 'ui']) {
      if (run.state.packages[name].installedVersion !== expectedVersions[name]) {
        throw new Error(`Installed @cqu-moe/${name} version does not match the candidate`);
      }
    }
    await run.command('pnpm', ['--dir', 'frontend', 'run', 'build'], {
      cwd: auth,
      env: commandEnv({
        VITE_POSTHOG_PROJECT_TOKEN: '',
        VITE_POSTHOG_HOST: '',
      }),
    });
    const browserArgs = ['--no-install', 'e2e-web', 'install', browserName];
    if (process.env.DESIGN_AUTH_BROWSER_WITH_DEPS === '1') browserArgs.push('--with-deps');
    await run.command('npx', browserArgs, { cwd: auth, env });
    await writeGeneratedSuite(auth);

    process.chdir(auth);
    const { startAuth } = await import(pathToFileURL(join(auth, 'e2e', 'runtime.mjs')).href);
    const { prepareAccount } = await import(
      pathToFileURL(join(auth, 'e2e', 'prepare-account.mjs')).href
    );
    run.state.variants = [];
    for (const variant of variants) {
      const output = join(auth, '.e2e', 'design-consumer', variant);
      await mkdir(output, { recursive: true });
      const runtime = await startAuth({ expectedCommit: AUTH_COMMIT });
      let code;
      let evidence;
      let primaryError;
      try {
        evidence = {
          authCommit: runtime.commit,
          browser: browserName,
          variant,
          cleanup: 'pending',
        };
        await writeFile(join(output, 'runtime.json'), JSON.stringify(evidence, null, 2) + '\n');
        process.env.AUTH_E2E_URL = runtime.origin;
        process.env.AUTH_E2E_CONTROL = runtime.controlOrigin;
        process.env.AUTH_CONSUMER_EMAIL = `design-${variant}-${randomUUID()}@example.test`;
        process.env.AUTH_CONSUMER_PASSWORD = AUTH_PASSWORD;
        const closeRuntime = runtime.close.bind(runtime);
        if (process.env.DESIGN_AUTH_FAIL_CLEANUP === '1') {
          runtime.close = async () => {
            await closeRuntime();
            throw new Error('Controlled Auth runtime cleanup failure');
          };
        }
        await prepareAccount(runtime, {
          email: process.env.AUTH_CONSUMER_EMAIL,
          password: AUTH_PASSWORD,
          name: 'Synthetic Consumer',
        });
        console.log(`Auth consumer runtime ready; commit ${runtime.commit}; ${variant}`);
        code = await runE2e(auth, output, variant);
        const report = JSON.parse(await readFile(join(output, 'report.json'), 'utf8'));
        const browserEvidence = JSON.parse(await readFile(join(output, 'browser.json'), 'utf8'));
        assert.equal(browserEvidence.requested, browserName);
        assert.equal(browserEvidence.actual, browserName);
        assert.ok(browserEvidence.version.length > 0);
        assert.deepEqual(
          browserEvidence.viewport,
          variant === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        );
        evidence.browser = browserEvidence;
        const summary = report.run.summary;
        if (!summary.executed || summary.skipped || summary.interrupted) {
          throw new Error('Required Auth consumer suite was empty, skipped or interrupted');
        }
        // e2e 0.21 can leave the body passed after an engine cleanup error.
        if (
          report.run.results.some(
            (result) =>
              result.selected &&
              result.attempts?.some(
                (attempt) =>
                  attempt.cleanup === 'failed' ||
                  attempt.secondaryErrors?.some((error) => error.phase === 'cleanup'),
              ),
          )
        ) {
          throw new Error('Auth consumer browser cleanup failed in framework attempt evidence');
        }
        if (process.env.DESIGN_AUTH_BREAK_ASSERTION !== '1') {
          if (code !== 0 || summary.failed || report.run.status !== 'passed') {
            throw new Error('Auth consumer runner result mismatch');
          }
        } else if (code !== 1 || summary.failed !== 1 || report.run.status !== 'failed') {
          throw new Error('Controlled login assertion did not fail exactly once');
        }
        if (code !== 0) {
          const failure = report.run.results
            .find((result) => result.selected)
            ?.attempts?.find((attempt) => attempt.error)?.error;
          throw new Error(`Auth consumer E2E exited ${code}; see ${output}`, { cause: failure });
        }
      } catch (error) {
        primaryError = error;
      } finally {
        const finalErrors = primaryError ? [{ phase: 'primary', error: primaryError }] : [];
        let cleanupError;
        try {
          await runtime.close();
        } catch (error) {
          cleanupError = error;
        }
        if (evidence) {
          evidence.cleanup = cleanupError ? 'failed' : 'passed';
          evidence.primaryError = primaryError?.stack;
          evidence.cleanupError = cleanupError?.stack;
          evidence.listenersClosed = {};
          for (const [name, url] of [
            ['auth', runtime.origin],
            ['control', runtime.controlOrigin],
          ]) {
            try {
              await fetch(url, { signal: AbortSignal.timeout(1_000) });
              evidence.listenersClosed[name] = false;
            } catch (error) {
              evidence.listenersClosed[name] = error.cause?.code === 'ECONNREFUSED';
            }
            if (!evidence.listenersClosed[name]) {
              finalErrors.push({
                phase: 'cleanup',
                error: new Error(`Auth ${name} listener did not close`),
              });
            }
          }
        }
        try {
          await writeFile(join(output, 'runtime.json'), JSON.stringify(evidence, null, 2) + '\n');
          if (process.env.DESIGN_AUTH_PROBE_SECRET_ARTIFACT === '1') {
            await writeFile(join(output, 'late-synthetic-marker.txt'), AUTH_PASSWORD);
          }
        } catch (error) {
          finalErrors.push({ phase: 'evidence', error });
        }
        if (cleanupError) finalErrors.push({ phase: 'cleanup', error: cleanupError });
        const publication = await publishAuthConsumerEvidence({
          source: output,
          destination: join(run.artifacts, variant),
          scan: (directory) => runtime.checkArtifacts(directory),
          failures: finalErrors,
          quarantineParent: dirname(run.work),
        });
        if (!publication.published) {
          run.state.publication = publication;
          if (publication.preserveWork) run.state.privateWorkPreserved = true;
          // Preserve independent failure phases without sending unscanned messages
          // to verification's public run.json or console output.
          const phases = publication.errors.map(({ phase }) => phase);
          throw new AggregateError(
            phases.map(
              (phase) => new Error(`Auth consumer ${phase} failure; unscanned details withheld`),
            ),
            'Auth consumer artifact publication rejected; unscanned details retained privately',
          );
        }
        if (finalErrors.length === 1) throw finalErrors[0].error;
        if (finalErrors.length > 1) {
          throw new Error(
            `Auth consumer failed with multiple errors:\n${finalErrors
              .map(({ error }) => error.stack || String(error))
              .join('\n\n')}`,
          );
        }
      }
      run.state.variants.push({
        browser: evidence.browser,
        variant,
        cleanup: evidence.cleanup,
        result: code === 0 ? 'passed' : 'failed',
      });
      if (code !== 0) throw new Error(`Auth consumer E2E exited ${code}; see ${output}`);
    }
  },
  { privateOutput: true },
);
