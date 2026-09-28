import { mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/theme.ts'], outdir: 'dist', format: 'esm', target: 'es2022' });
execFileSync(
  'pnpm',
  [
    'exec',
    'tsc',
    'src/theme.ts',
    '--declaration',
    '--emitDeclarationOnly',
    '--outDir',
    'dist',
    '--target',
    'ES2022',
    '--module',
    'ESNext',
    '--moduleResolution',
    'bundler',
    '--skipLibCheck',
  ],
  { stdio: 'inherit' },
);
await copyFile('src/tokens.css', 'dist/styles.css');
