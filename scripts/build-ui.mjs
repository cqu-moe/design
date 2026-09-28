import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  target: 'es2022',
  jsx: 'automatic',
  packages: 'external',
});
execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(
  'pnpm',
  ['exec', 'tailwindcss', '-i', 'src/styles.css', '-o', 'dist/styles.css', '--minify'],
  { stdio: 'inherit' },
);

// Version the consuming Agent's rules with the component code.
const { cp, mkdir, copyFile } = await import('node:fs/promises');
await mkdir('dist/docs', { recursive: true });
await mkdir('dist/examples/pages', { recursive: true });
await copyFile('../../DESIGN.md', 'dist/DESIGN.md');
for (const name of ['tokens', 'layout', 'components', 'motion', 'consumption', 'visual-review'])
  await copyFile(`../../docs/${name}.md`, `dist/docs/${name}.md`);
await copyFile('../../scripts/check-design.mjs', 'dist/check-design.mjs');
await cp('../../apps/preview/src/pages', 'dist/examples/pages', { recursive: true });
await copyFile('../../apps/preview/src/styles.css', 'dist/examples/styles.css');
await copyFile('../../apps/preview/src/demo-data.ts', 'dist/examples/demo-data.ts');
await cp('../../docs/screenshots', 'dist/docs/screenshots', { recursive: true });
await copyFile('../../docs/contrast.json', 'dist/docs/contrast.json');
