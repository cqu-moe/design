import { mkdir, mkdtemp, readFile, writeFile, realpath, rm, rename } from 'node:fs/promises';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createApp } from './create-app.mjs';
await mkdir('.verification', { recursive: true });
const work = await mkdtemp(resolve('.verification/consumer-'));
const generated = await createApp(join(work, 'generated'));
const project = join(work, 'relocated-app');
await rename(generated, project);
const entry = join(project, 'src/main.tsx');
const source = await readFile(entry, 'utf8');
execFileSync('pnpm', ['install', '--no-frozen-lockfile'], { cwd: project, stdio: 'inherit' });
execFileSync('pnpm', ['build'], { cwd: project, stdio: 'inherit' });
execFileSync('pnpm', ['check:design'], { cwd: project, stdio: 'inherit' });
await writeFile(
  entry,
  "import {DataChart} from '@cqu-moe/ui/charts';\nimport {ActionButton} from '@cqu-moe/ui';\n" +
    source
      .replace(
        'children: [',
        `children: [
      { path: 'verify-forbidden', loader: () => { throw new Response('PRIVATE_SERVER_MESSAGE', { status: 403 }); } },
    `,
      )
      .replace(
        '<Button onClick={',
        '<ActionButton state="success" labels={{idle:"保存",loading:"保存中",success:"状态组件已就绪",error:"重试"}} /><DataChart title="独立图表验证" kind="bar" valueLabel="请求数" data={[{label:"示例",value:12}]} />\n      <Button onClick={',
      ),
);
execFileSync('pnpm', ['build'], { cwd: project, stdio: 'inherit' });

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
  assert.equal(
    await page.getByRole('button', { name: '状态组件已就绪' }).getAttribute('data-action-state'),
    'success',
  );
  assert.equal(
    await page
      .getByRole('button', { name: '检查交互' })
      .locator('svg')
      .getAttribute('stroke-width'),
    '2',
  );
  assert.equal(
    await page.getByRole('button', { name: '检查交互' }).locator('svg').getAttribute('aria-hidden'),
    'true',
  );
  await page.getByRole('button', { name: '检查交互' }).click();
  await page
    .locator('[data-sonner-toast]')
    .getByText('共享组件已就绪。', { exact: true })
    .waitFor();
  assert.equal(await page.locator('section[aria-label="通知"]').count(), 1);
  await page.getByRole('button', { name: '关闭通知', exact: true }).click();
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
  await page.goto('http://127.0.0.1:5174/verify-forbidden');
  await page.getByRole('heading', { name: '没有访问权限', exact: true }).waitFor();
  assert.equal(await page.getByText('PRIVATE_SERVER_MESSAGE').count(), 0);
  await page.getByRole('link', { name: '返回首页', exact: true }).click();
  await page.goto('http://127.0.0.1:5174/missing');
  await page.getByRole('heading', { name: '未找到页面', exact: true }).waitFor();
  await page.getByRole('link', { name: '返回首页', exact: true }).click();
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
          'generated template with portable relative tarballs',
          'tarball install',
          'lucide-react direct import and decorative icon semantics',
          'not-found and forbidden recovery without exposing server errors',
          'ActionButton from installed package',
          'TypeScript and production build',
          'single React instance',
          'standalone CSS',
          'theme persistence',
          'mobile navigation',
          'no browser errors',
          'portable Agent docs and design checker',
          'charts subpath and accessible data table',
          'single themed notification host',
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
