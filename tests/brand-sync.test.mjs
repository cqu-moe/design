import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const script = join(process.cwd(), 'scripts/brand.mjs');
const source = join(process.cwd(), 'assets/brand/path-family');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function withConsumer(action) {
  const root = await mkdtemp(join(tmpdir(), 'design-brand-consumer-'));
  try {
    await writeFile(join(root, 'package.json'), '{}\n');
    await action(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function brand(command, product, target) {
  return spawnSync(process.execPath, [script, command, product, target], { encoding: 'utf8' });
}

async function assertSameFile(from, to) {
  assert.equal(
    hash(await readFile(to)),
    hash(await readFile(from)),
    `${to} must match its canonical brand source`,
  );
}

test('homepage sync distributes every product logo variant and verifies its manifest', async () => {
  const products = JSON.parse(await readFile(join(source, 'source/marks.json'), 'utf8')).products.map(
    ({ id }) => id,
  );
  await withConsumer(async (target) => {
    await mkdir(join(target, 'public'));
    const result = brand('sync', 'cqu-moe', target);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const id of products)
      for (const file of ['logo.svg', 'logo-dark.svg', 'logo-black.svg', 'logo-white.svg'])
        await assertSameFile(join(source, id, file), join(target, 'public/brand', id, file));
    for (const [file, destination] of [
      ['favicon.svg', 'public/favicon.svg'],
      ['favicon.ico', 'public/favicon.ico'],
      ['icon-192.png', 'public/apple-touch-icon.png'],
    ])
      await assertSameFile(join(source, 'cqu-moe', file), join(target, destination));
    const check = brand('check', 'cqu-moe', target);
    assert.equal(check.status, 0, check.stdout + check.stderr);
  });
});

test('website products sync blue, monochrome, favicon, and app assets to their existing layout', async () => {
  await withConsumer(async (target) => {
    for (const product of ['quicklogin', 'jxzljc']) {
      await mkdir(join(target, product, 'website/public'), { recursive: true });
      await writeFile(join(target, product, 'package.json'), '{}\n');
      const result = brand('sync', product, join(target, product));
      assert.equal(result.status, 0, result.stdout + result.stderr);
      for (const file of [
        'logo.svg',
        'logo-dark.svg',
        'logo-black.svg',
        'logo-white.svg',
        'app-icon.svg',
        'favicon.svg',
        'favicon.ico',
        'icon-16.png',
        'icon-32.png',
        'icon-48.png',
        'icon-128.png',
      ])
        await assertSameFile(
          join(source, product, file),
          join(target, product, 'website/public/brand', file),
        );
    }
    for (const size of [16, 32, 48, 128])
      await assertSameFile(
        join(source, 'quicklogin', `icon-${size}.png`),
        join(target, 'quicklogin/public/icons', `icon-${size}.png`),
      );
  });
});

test('brand check detects a one-byte drift in distributed extension icons', async () => {
  await withConsumer(async (target) => {
    await mkdir(join(target, 'website/public'), { recursive: true });
    const sync = brand('sync', 'quicklogin', target);
    assert.equal(sync.status, 0, sync.stdout + sync.stderr);
    const changed = join(target, 'public/icons/icon-32.png');
    await writeFile(changed, Buffer.concat([await readFile(changed), Buffer.from([0])]));
    const check = brand('check', 'quicklogin', target);
    assert.equal(check.status, 1);
    assert.ok(check.stderr.includes(`Brand asset differs: ${changed}`));
  });
});
