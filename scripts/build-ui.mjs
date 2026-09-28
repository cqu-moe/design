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
