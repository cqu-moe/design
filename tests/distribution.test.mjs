import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
test('versioned UI distribution includes portable Agent contracts and scanner', () => {
  for (const file of [
    'packages/ui/dist/DESIGN.md',
    'packages/ui/dist/docs/components.md',
    'packages/ui/dist/docs/layout.md',
    'packages/ui/dist/check-design.mjs',
    'templates/app/AGENTS.md',
  ])
    assert.ok(existsSync(file), `${file} must exist`);
  const agent = readFileSync('templates/app/AGENTS.md', 'utf8');
  assert.match(agent, /node_modules\/@cqu-moe\/ui\/dist\/DESIGN.md/);
  const pkg = JSON.parse(readFileSync('templates/app/package.json', 'utf8'));
  assert.ok(pkg.scripts['check:design']);
});

test('scanner invoked through an installed symlink actually rejects violations', async () => {
  const { mkdir, mkdtemp, symlink, writeFile, rm } = await import('node:fs/promises');
  const { resolve, join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  await mkdir('.verification', { recursive: true });
  const dir = await mkdtemp(resolve('.verification/scanner-'));
  try {
    await symlink(resolve('scripts/check-design.mjs'), join(dir, 'check.mjs'));
    await mkdir(join(dir, 'src'));
    await writeFile(join(dir, 'src', 'bad.css'), '.bad { color: #ff0000; }');
    const result = spawnSync(process.execPath, [join(dir, 'check.mjs'), join(dir, 'src')], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
