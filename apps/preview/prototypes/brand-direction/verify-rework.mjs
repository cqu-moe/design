// Run through ego-browser nodejs after assigning an authorized TaskSpace ID to globalThis.brandVerificationSpaceId.
// Checks visible content/navigation, responsive overflow, and the local form flow.
const assert = (await import('node:assert/strict')).default;
const fs = await import('node:fs/promises');
assert.ok(
  Number.isInteger(globalThis.brandVerificationSpaceId),
  'Set the current authorized TaskSpace ID before running',
);
const task = await taskSpace(globalThis.brandVerificationSpaceId);
const page = task.page('p1');
const output = '/Users/uu/.codex/worktrees/1fb7/design/.verification/brand-direction-v2';
await fs.mkdir(output, { recursive: true });
await page.cdp('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__prototypeErrors=[]; addEventListener('error', e=>window.__prototypeErrors.push(e.message)); addEventListener('unhandledrejection', e=>window.__prototypeErrors.push(String(e.reason))); const original=console.error; console.error=(...a)=>{window.__prototypeErrors.push(a.map(String).join(' '));original(...a);};`,
});
await page.goto('http://127.0.0.1:5188/prototypes/brand-direction/?v=1&product=quicklogin');
await page.waitForSelector('.hero');
const report = { layouts: [], colors: [], interactions: [], screenshots: [] };
for (const theme of ['light', 'dark']) {
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== theme)
    await page.click(`button[aria-label="切换${theme === 'dark' ? '深' : '浅'}色"]`);
  for (const [product, index] of [
    ['quicklogin', 1],
    ['jxzljc', 2],
  ]) {
    await page.click(`[aria-label="示例产品"] button:nth-child(${index})`);
    for (const width of [320, 390, 768, 1440]) {
      await page.cdp('Emulation.setDeviceMetricsOverride', {
        width,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await page.cdp('Emulation.setTouchEmulationEnabled', { enabled: width < 768 });
      for (let variant = 1; variant <= 3; variant++) {
        await page.click(`.proto-picker-item:nth-of-type(${variant})`);
        await page.evaluate(async () => {
          await Promise.all([...document.images].map((i) => i.decode()));
          scrollTo(0, 0);
        });
        const state = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          active: document.querySelectorAll('.proto-picker-item[data-active]').length,
          brokenAnchors: [...document.querySelectorAll('a[href^="#"]')]
            .filter((a) => !document.getElementById(a.hash.slice(1)))
            .map((a) => a.href),
          imageFailures: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
          tooSmall: [...document.querySelectorAll('button,a,summary')]
            .filter((e) => e.getClientRects().length && !e.classList.contains('skip-link'))
            .filter((e) => {
              if (!matchMedia('(pointer: coarse)').matches) return false;
              const r = e.getBoundingClientRect(),
                after = getComputedStyle(e, '::after');
              return (
                Math.max(r.height, parseFloat(after.height) || 0) < 44 ||
                Math.max(r.width, parseFloat(after.width) || 0) < 44
              );
            })
            .map((e) => e.textContent || e.getAttribute('aria-label')),
          errors: window.__prototypeErrors,
        }));
        assert.equal(state.width, width);
        assert.ok(
          state.scrollWidth <= width,
          `${product} v${variant} ${theme} ${width} overflow ${state.scrollWidth}`,
        );
        assert.equal(state.active, 1);
        assert.deepEqual(state.brokenAnchors, []);
        assert.equal(state.imageFailures, 0);
        assert.deepEqual(state.tooSmall, [], `touch targets ${product} v${variant} ${width}`);
        assert.deepEqual(state.errors, []);
        report.layouts.push({ product, theme, width, variant });
        if (width === 1440 || (width === 390 && variant === 1)) {
          const path = `${output}/${product}-${variant}-${theme}-${width}.png`;
          await page.screenshot({ path, fullPage: width === 390 });
          report.screenshots.push(path);
          if (width === 1440 && theme === 'light' && variant === 1)
            await page.screenshot({ path: `${output}/${product}-complete.png`, fullPage: true });
        }
      }
    }
  }
}
await fs.writeFile(`${output}/layout-report.json`, JSON.stringify(report, null, 2) + '\n');
for (const theme of ['light', 'dark']) {
  if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== theme)
    await page.click(`button[aria-label="切换${theme === 'dark' ? '深' : '浅'}色"]`);
  const colors = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const l = (color) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const v = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((n) => {
        n /= 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
      return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
    };
    const styles = getComputedStyle(document.querySelector('.brand-prototype')),
      t = (n) => styles.getPropertyValue(n),
      ratio = (a, b) => {
        a = l(a);
        b = l(b);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
    return {
      brand: ratio(t('--brand-ink'), t('--background')),
      onSolid: ratio(t('--brand-on-solid'), t('--brand-solid')),
      muted: ratio(t('--muted-foreground'), t('--background')),
    };
  });
  for (const [role, value] of Object.entries(colors))
    assert.ok(value >= 4.5, `${theme} 蓝 ${role} ${value}`);
  report.colors.push({ theme, palette: '蓝', ...colors });
}
await page.click('.proto-picker-item:nth-of-type(1)');
await page.fill('#sample-score', '88');
await page.click('.sample-footer button');
assert.equal(await page.evaluate(() => document.querySelectorAll('.sample-course').length), 3);
assert.match(await page.evaluate(() => document.querySelector('.sample-course').textContent), /88/);
await page.click('.sample-course:first-child');
assert.match(
  await page.evaluate(() => document.querySelector('.sample-footer').textContent),
  /已选 2 门/,
);
await page.click('.sample-footer button');
assert.match(
  await page.evaluate(() => document.querySelector('.sample-complete').textContent),
  /2 门示例课程/,
);
await page.click('.sample-footer button');
await page.waitForSelector('#sample-score');
assert.equal(await page.evaluate(() => document.querySelector('#sample-score').value), '88');
await page.click('.faq-list details:first-child summary');
assert.equal(await page.evaluate(() => document.querySelector('.faq-list details').open), true);
await page.click('.marketing-action');
assert.equal(await page.evaluate(() => location.hash), '#install');
assert.ok(
  await page.evaluate(() => document.getElementById('install').getBoundingClientRect().top >= 0),
);
await page.click('.hero-actions button');
await page.waitForSelector('.work-surface');
await page.waitForSelector('#score');
await page.click('button[type="submit"]');
assert.equal(
  await page.evaluate(() => !!document.querySelector('#score')),
  true,
  'blank form must stay editable',
);
await page.click('#grade');
await page.click('text="满意"');
await page.fill('#score', '90');
await page.fill('#comment', '示例评语：希望增加课堂练习。');
await page.focus('#comment');
await page.keyboard.press('3');
assert.equal(
  await page.evaluate(() => new URL(location.href).searchParams.get('v')),
  '1',
  'typing must not switch variant',
);
await page.click('button[type="submit"]');
await page.waitForSelector('#review-heading');
assert.equal(await page.evaluate(() => document.activeElement.id), 'review-heading');
await page.click('text="返回修改"');
await page.waitForSelector('#score');
assert.equal(await page.evaluate(() => document.querySelector('#score').value), '90');
assert.match(
  await page.evaluate(() => document.querySelector('#comment').value),
  /希望增加课堂练习/,
);
await page.click('button[type="submit"]');
await page.click('text="完成演示"');
await page.waitForSelector('[role="status"]');
assert.match(
  await page.evaluate(() => document.querySelector('[role="status"]').textContent),
  /没有向学校提交/,
);
await page.screenshot({ path: `${output}/evaluation-work.png` });
report.interactions.push(
  'evaluation validation, review, draft preservation, local completion, FAQ, installation anchor, native hero demo, course selection, retained values',
);
await page.click('text="返回产品介绍"');
await page.waitForSelector('.hero');
await page.click('[aria-label="示例产品"] button:nth-child(1)');
await page.click('.stage-tabs button:nth-child(2)');
assert.match(
  await page.evaluate(() => document.querySelector('.quick-status').textContent),
  /已有学校登录/,
);
await page.click('.hero-actions button');
await page.waitForSelector('.work-surface');
await page.click('#quick-switch');
assert.match(
  await page.evaluate(() => document.querySelector('.quick-status').textContent),
  /已暂停/,
);
await page.click('#quick-switch');
assert.match(
  await page.evaluate(() => document.querySelector('.quick-status').textContent),
  /已就绪/,
);
await page.click('text="返回产品介绍"');
await page.waitForSelector('.hero');
await page.keyboard.press('2');
await page.reload();
await page.waitForSelector('.hero-manual');
assert.equal(await page.evaluate(() => new URL(location.href).searchParams.get('v')), '2');
await page.keyboard.press('ArrowRight');
await page.waitForSelector('.hero-demo');
await page.cdp('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
assert.equal(
  await page.evaluate(
    () => getComputedStyle(document.querySelector('.proto-picker-highlight')).transitionDuration,
  ),
  '0s',
);
report.interactions.push(
  'QuickLogin state switch, pause/resume, URL restoration, keyboard, reduced motion',
);
assert.deepEqual(await page.evaluate(() => window.__prototypeErrors), []);
await page.cdp('Emulation.setEmulatedMedia', { features: [] });
await page.cdp('Emulation.setTouchEmulationEnabled', { enabled: false });
await page.goto('http://127.0.0.1:5188/prototypes/brand-direction/?v=99&product=unknown');
await page.waitForSelector('.hero-split');
assert.equal(await page.evaluate(() => new URL(location.href).searchParams.get('v')), '1');
assert.equal(
  await page.evaluate(() => new URL(location.href).searchParams.get('product')),
  'quicklogin',
);
await fs.writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log({
  layouts: report.layouts.length,
  colors: report.colors.length,
  interactions: report.interactions,
  screenshots: report.screenshots.length,
});
