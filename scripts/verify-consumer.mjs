import { mkdir, mkdtemp, cp, readFile, writeFile, readdir, realpath, rm } from 'node:fs/promises';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const root = process.cwd();
await mkdir('.verification', { recursive: true });
const work = await mkdtemp(resolve('.verification/consumer-'));
const artifacts = join(work, 'artifacts');
await mkdir(artifacts);
for (const name of ['theme', 'ui'])
  execFileSync('pnpm', ['pack', '--pack-destination', artifacts], {
    cwd: join(root, 'packages', name),
    stdio: 'inherit',
  });
const project = join(work, 'app');
await cp('templates/app', project, { recursive: true });
const entry = join(project, 'src/main.tsx');
const source = await readFile(entry, 'utf8');
await writeFile(
  entry,
  "import {DataChart} from '@cqu-moe/ui/charts';\n" +
    source.replace(
      '<Button onClick={',
      '<DataChart title="独立图表验证" kind="bar" valueLabel="请求数" data={[{label:"示例",value:12}]} />\n      <Button onClick={',
    ),
);
const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
const files = await readdir(artifacts);
const theme =
  'file:' +
  join(
    artifacts,
    files.find((f) => f.includes('-theme-')),
  );
const ui =
  'file:' +
  join(
    artifacts,
    files.find((f) => f.includes('-ui-')),
  );
manifest.dependencies['@cqu-moe/theme'] = theme;
manifest.dependencies['@cqu-moe/ui'] = ui;
await writeFile(join(project, 'package.json'), JSON.stringify(manifest, null, 2));
await writeFile(
  join(project, 'pnpm-workspace.yaml'),
  `packages:\n  - .\noverrides:\n  '@cqu-moe/theme': '${theme}'\nallowBuilds:\n  esbuild: true\n  '@parcel/watcher': true\n`,
);
await writeFile(join(project, '.npmrc'), 'registry=https://registry.npmjs.org\nsave-exact=true\n');
execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { cwd: project, stdio: 'inherit' });
execFileSync('pnpm', ['build'], { cwd: project, stdio: 'inherit' });
execFileSync('pnpm', ['check:design'], { cwd: project, stdio: 'inherit' });
await writeFile(join(project, 'src', 'intentional-rule-violation.css'), '.bad { color: #ff0000; }');
const rejected = spawnSync('pnpm', ['check:design'], { cwd: project, encoding: 'utf8' });
assert.equal(rejected.status, 1, 'The installed scanner must reject a deliberate raw color');
await rm(join(project, 'src', 'intentional-rule-violation.css'));
execFileSync('pnpm', ['check:design'], { cwd: project, stdio: 'inherit' });
assert.ok(
  (await readFile(join(project, 'AGENTS.md'), 'utf8')).includes(
    'node_modules/@cqu-moe/ui/dist/DESIGN.md',
  ),
);
await readFile(join(project, 'node_modules/@cqu-moe/ui/dist/DESIGN.md'), 'utf8');
const requireApp = createRequire(join(project, 'package.json'));
const requireUi = createRequire(
  await realpath(join(project, 'node_modules/@cqu-moe/ui/package.json')),
);
assert.equal(
  await realpath(requireApp.resolve('react')),
  await realpath(requireUi.resolve('react')),
  'UI must share the consumer React instance',
);
const server = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '5174', '--strictPort'],
  { cwd: project, stdio: 'pipe', detached: true },
);
let logs = '';
server.stdout.on('data', (d) => (logs += d));
server.stderr.on('data', (d) => (logs += d));
let browser;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      const response = await fetch('http://127.0.0.1:5174');
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, logs);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 800 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:5174');
  await page.getByRole('heading', { name: '新的工作空间' }).waitFor();
  await page.getByText('查看独立图表验证数据', { exact: true }).click();
  assert.ok(await page.getByRole('table', { name: '独立图表验证数据' }).isVisible());
  const button = page.getByRole('button', { name: '检查交互' });
  assert.ok(
    await button.evaluate((el) => getComputedStyle(el).minHeight === '44px'),
    'Packaged CSS must load without scanning UI source',
  );
  await page.getByRole('button', { name: '外观设置' }).click();
  await page.getByRole('menuitemradio', { name: '深色', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: '打开导航' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(work, 'consumer-dark-mobile.png'), fullPage: true });
  await writeFile(
    'docs/consumer-verification.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        result: 'passed',
        workspace: work,
        checks: [
          'tarball install',
          'TypeScript and production build',
          'single React instance',
          'standalone CSS',
          'theme persistence',
          'mobile navigation',
          'no browser errors',
          'portable Agent docs and design checker',
          'charts subpath and accessible data table',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Independent consumer passed: ' + project);
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill();
  }
}
