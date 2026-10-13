import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'assets/brand/path-family');
const products = ['schedule', 'auth', 'quicklogin'];
const common = [
  'logo.svg',
  'logo-dark.svg',
  'logo-black.svg',
  'logo-white.svg',
  'favicon.svg',
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
];
const [command, product, targetArg] = process.argv.slice(2);
const hash = (data) => createHash('sha256').update(data).digest('hex');

async function verifyManifest() {
  const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
  for (const [file, expected] of Object.entries(manifest)) {
    const bytes = await readFile(path.join(source, file));
    if (hash(bytes) !== expected.sha256 || bytes.length !== expected.bytes)
      throw new Error(`Stale brand manifest: ${file}. Run python3 scripts/package-brand.py.`);
  }
}

async function copy(from, to) {
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to);
}

async function run() {
  if (!['prepare', 'sync', 'check'].includes(command))
    throw new Error(
      'Usage: node scripts/brand.mjs prepare | sync|check <schedule|auth|quicklogin> <repo-root>',
    );
  await verifyManifest();
  if (command === 'prepare') {
    const dest = path.join(root, 'apps/preview/public/brand');
    for (const id of products) {
      for (const file of await readdir(path.join(source, id)))
        await copy(path.join(source, id, file), path.join(dest, id, file));
    }
    for (const file of [
      'index.html',
      'overview.svg',
      'overview.png',
      'README.md',
      'VERIFICATION.md',
      'palette.json',
      'manifest.json',
    ])
      await copy(path.join(source, file), path.join(dest, file));
    // The standalone catalog's documentation also links to its source.
    async function copyTree(from, to) {
      for (const entry of await readdir(from, { withFileTypes: true })) {
        if (entry.isDirectory())
          await copyTree(path.join(from, entry.name), path.join(to, entry.name));
        else await copy(path.join(from, entry.name), path.join(to, entry.name));
      }
    }
    await copyTree(path.join(source, 'source'), path.join(dest, 'source'));
    await copy(path.join(source, 'qa/report.json'), path.join(dest, 'qa/report.json'));
    await copy(
      path.join(root, 'assets/brand/cqu-moe-logo-kit-v1.zip'),
      path.join(dest, 'cqu-moe-logo-kit-v1.zip'),
    );
    console.log('Prepared canonical brand assets for preview.');
    return;
  }
  if (!products.includes(product) || !targetArg)
    throw new Error('Specify a supported product and its existing repository root.');
  const target = path.resolve(targetArg);
  await stat(path.join(target, 'package.json'));
  const publicDir = product === 'quicklogin' ? 'website/public' : 'frontend/public';
  await stat(path.join(target, publicDir));
  const files =
    product === 'quicklogin'
      ? common.filter((file) => !['logo-black.svg', 'logo-white.svg'].includes(file))
      : common;
  const mappings = files.map((file) => [file, `${publicDir}/brand/${file}`]);
  if (product === 'quicklogin') {
    for (const file of ['logo.svg', 'logo-dark.svg']) mappings.push([file, `public/brand/${file}`]);
    for (const size of [16, 32, 48, 128])
      mappings.push([`icon-${size}.png`, `public/icons/icon-${size}.png`]);
  }
  for (const [file, relative] of mappings) {
    const from = path.join(source, product, file);
    const to = path.join(target, relative);
    if (command === 'sync') await copy(from, to);
    if (hash(await readFile(from)) !== hash(await readFile(to)))
      throw new Error(`Brand asset differs: ${to}`);
  }
  console.log(
    `${product}: ${mappings.length} canonical assets ${command === 'sync' ? 'synced and ' : ''}verified.`,
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
