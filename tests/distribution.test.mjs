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

test('v1 consumer entry, template dependencies and local documentation links travel with the package', async () => {
  const { readdir } = await import('node:fs/promises');
  const { resolve, dirname, join } = await import('node:path');
  const root = resolve('packages/ui/dist');
  for (const name of [
    'START-HERE.md',
    'docs/agent-start.md',
    'docs/icons.md',
    'docs/states.md',
    'docs/feedback-contract.md',
    'docs/agent-prompts.md',
    'template/src/main.tsx',
  ])
    assert.ok(existsSync(join(root, name)), name);
  for (const file of [
    'START-HERE.md',
    'DESIGN.md',
    ...(await readdir(join(root, 'docs')))
      .filter((name) => name.endsWith('.md'))
      .map((name) => 'docs/' + name),
  ]) {
    const source = readFileSync(join(root, file), 'utf8');
    for (const [, target] of source.matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g)) {
      if (/^(https?:|#)/.test(target)) continue;
      assert.ok(
        existsSync(resolve(dirname(join(root, file)), target.split('#')[0])),
        `${file} -> ${target}`,
      );
    }
  }
  const ui = JSON.parse(readFileSync('packages/ui/package.json', 'utf8'));
  const template = JSON.parse(readFileSync('templates/app/package.json', 'utf8'));
  assert.equal(template.dependencies['lucide-react'], ui.dependencies['lucide-react']);
  assert.equal(template.dependencies['@cqu-moe/ui'], ui.version);
  assert.equal(template.dependencies['@cqu-moe/theme'], ui.version);
});

test('project generator refuses to overwrite existing work', async () => {
  const { createApp } = await import('../scripts/create-app.mjs');
  await assert.rejects(createApp('templates/app'), /目标已存在/);
});


test('Vite consumers keep lazy Select dependencies out of the initial load', async () => {
  const { build } = await import('vite');
  const { mkdir, mkdtemp, writeFile, rm } = await import('node:fs/promises');
  const { resolve, join } = await import('node:path');
  await mkdir('.verification', { recursive: true });
  const dir = await mkdtemp(resolve('.verification/lazy-ui-'));
  try {
    await writeFile(join(dir, 'index.html'), '<script type="module" src="/entry.js"></script>');
    await writeFile(join(dir, 'entry.js'),
      "import { Button } from '@cqu-moe/ui'; console.log(Button); window.loadSelect = () => import('./lazy.js');");
    await writeFile(join(dir, 'lazy.js'), "export { Select } from '@cqu-moe/ui';");
    const { output } = await build({
      root: dir,
      configFile: false,
      resolve: { alias: { '@cqu-moe/ui': resolve('packages/ui/dist/index.js') } },
      build: { write: false },
      logLevel: 'silent',
    });
    const chunks = output.filter(item => item.type === 'chunk');
    const outputs = Object.fromEntries(chunks.map(chunk => [chunk.fileName, chunk]));
    const entry = chunks.find(chunk => chunk.isEntry)?.fileName;
    assert.ok(entry, 'consumer entry must be emitted');
    const initial = new Set();
    function visit(file) {
      if (initial.has(file)) return;
      initial.add(file);
      for (const dependency of outputs[file].imports) visit(dependency);
    }
    visit(entry);
    const containsSelect = file => Object.entries(outputs[file].modules).some(([name, data]) =>
      name.includes('@radix-ui/react-select/') && data.renderedLength > 0);
    assert.ok(Object.keys(outputs).some(containsSelect), 'Select must still ship in the lazy graph');
    assert.ok(![...initial].some(containsSelect), 'Select must not be downloaded with the initial Button');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
