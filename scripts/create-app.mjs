import { cp, mkdir, readFile, writeFile, lstat, realpath } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { installCandidatePackages } from './candidate-packages.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
export async function createApp(destination, { candidateDir } = {}) {
  const project = resolve(destination);
  try {
    await lstat(project);
    throw new Error(`目标已存在，请选择新的目录：${project}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const name of ['theme', 'ui'])
    await readFile(join(root, 'packages', name, 'dist', name === 'ui' ? 'index.js' : 'theme.js'));
  await cp(join(root, 'templates/app'), project, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  const artifacts = join(project, '.design');
  await mkdir(artifacts);
  const manifest = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  const expectedVersions = {};
  for (const name of ['theme', 'ui']) {
    const pkg = JSON.parse(await readFile(join(root, 'packages', name, 'package.json'), 'utf8'));
    expectedVersions[name] = pkg.version;
    if (!candidateDir)
      execFileSync('pnpm', ['pack', '--pack-destination', artifacts], {
        cwd: join(root, 'packages', name),
        stdio: 'inherit',
      });
    manifest.dependencies[pkg.name] = `file:./.design/cqu-moe-${name}-${pkg.version}.tgz`;
  }
  if (candidateDir) {
    const verified = await installCandidatePackages(candidateDir, artifacts, expectedVersions);
    console.log(`已校验候选安装包：${verified.source}`);
  }
  await writeFile(join(project, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(
    join(project, 'pnpm-workspace.yaml'),
    `packages:\n  - .\noverrides:\n  '@cqu-moe/theme': '${manifest.dependencies['@cqu-moe/theme']}'\nallowBuilds:\n  esbuild: true\n  '@parcel/watcher': true\n`,
  );
  console.log(
    `已生成 ${relative(process.cwd(), project) || project}；在该目录执行 pnpm install && pnpm build && pnpm check:design && pnpm dev。`,
  );
  return project;
}
if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  if (process.argv.length !== 3) throw new Error('用法：pnpm create:app <新的项目目录>');
  await createApp(process.argv[2]);
}
