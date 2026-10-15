import { readFile, writeFile, realpath, rm, rename } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { createApp } from './create-app.mjs';
import { candidate, serveBuild, verification } from './verification-runtime.mjs';
import { guardNetwork } from './browser-network.mjs';

await verification('consumer', async (run) => {
  const { work } = run;
  let browser, context, page, server;
  try {
    const generated = await candidate(run, () => createApp(join(work, 'generated')));
    const project = join(work, 'relocated-app');
    await rename(generated, project);
    run.state.packages = {};
    for (const name of ['theme', 'ui']) {
      const { version } = JSON.parse(await readFile(`packages/${name}/package.json`, 'utf8'));
      const bytes = await readFile(join(project, '.design', `cqu-moe-${name}-${version}.tgz`));
      run.state.packages[name] = {
        version,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
    }
    const entry = join(project, 'src/main.tsx');
    const source = await readFile(entry, 'utf8');
    await run.command('pnpm', ['install', '--no-frozen-lockfile'], { cwd: project });
    await writeFile(
      join(run.artifacts, 'consumer-lock.yaml'),
      await readFile(join(project, 'pnpm-lock.yaml')),
    );
    await run.command('pnpm', ['build'], { cwd: project });
    await run.command('pnpm', ['check:design'], { cwd: project });
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
    await run.command('pnpm', ['build'], { cwd: project });

    await writeFile(
      join(project, 'src', 'intentional-rule-violation.css'),
      '.bad { color: #ff0000; }',
    );
    const rejected = spawnSync('pnpm', ['check:design'], { cwd: project, encoding: 'utf8' });
    assert.equal(rejected.status, 1, 'The installed scanner must reject a deliberate raw color');
    await rm(join(project, 'src', 'intentional-rule-violation.css'));
    await run.command('pnpm', ['check:design'], { cwd: project });
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
    server = await serveBuild(join(project, 'dist'));
    run.state.baseURL = server.url;
    browser = await chromium.launch();
    context = await browser.newContext({
      viewport: { width: 390, height: 800 },
      hasTouch: true,
      baseURL: server.url,
      serviceWorkers: 'block',
    });
    const checkNetwork = await guardNetwork(context, server.url);
    await context.tracing.start({ screenshots: true, snapshots: true });
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
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
      await page
        .getByRole('button', { name: '检查交互' })
        .locator('svg')
        .getAttribute('aria-hidden'),
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
    await page.screenshot({
      path: join(run.artifacts, 'consumer-light-mobile.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: '外观设置' }).click();
    await page.getByRole('menuitemradio', { name: '深色', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.getByRole('button', { name: '打开导航' }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.goto('/verify-forbidden');
    await page.getByRole('heading', { name: '没有访问权限', exact: true }).waitFor();
    assert.equal(await page.getByText('PRIVATE_SERVER_MESSAGE').count(), 0);
    await page.getByRole('link', { name: '返回首页', exact: true }).click();
    await page.goto('/missing');
    await page.getByRole('heading', { name: '未找到页面', exact: true }).waitFor();
    await page.getByRole('link', { name: '返回首页', exact: true }).click();
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: join(run.artifacts, 'consumer-dark-mobile.png'),
      fullPage: true,
    });
    checkNetwork();
  } catch (error) {
    if (page && !page.isClosed()) {
      await page.screenshot({ path: join(run.artifacts, 'failure.png'), fullPage: true });
    }
    throw error;
  } finally {
    const cleanup = await Promise.allSettled([
      (async () => {
        try {
          if (context)
            await context.tracing.stop({ path: join(run.artifacts, 'consumer-trace.zip') });
        } finally {
          if (browser) await browser.close();
        }
      })(),
      server?.close(),
    ]);
    const errors = cleanup.filter((result) => result.status === 'rejected');
    if (errors.length)
      throw new AggregateError(
        errors.map((result) => result.reason),
        'Consumer cleanup failed',
      );
    if (server) run.state.serverClosed = true;
  }
});
