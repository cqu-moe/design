import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function parseChecksums(manifest) {
  const lines = manifest.trim().split(/\r?\n/);
  assert.equal(lines.length, 2, 'SHA256SUMS must contain exactly theme and UI');
  const entries = new Map();
  for (const line of lines) {
    const match = /^([a-f0-9]{64})\s+\*?([^\s/*]+)$/.exec(line);
    assert.ok(match, `Malformed SHA256SUMS line: ${line}`);
    assert.ok(!entries.has(match[2]), `Duplicate checksum for ${match[2]}`);
    entries.set(match[2], match[1]);
  }
  return entries;
}

export async function verifyCandidatePackages(sourceDir, expectedVersions) {
  const source = resolve(sourceDir);
  const expectedFiles = ['theme', 'ui'].map(
    (name) => `cqu-moe-${name}-${expectedVersions[name]}.tgz`,
  );
  const actualFiles = (await readdir(source)).filter((name) => name.endsWith('.tgz')).sort();
  assert.deepEqual(
    actualFiles,
    [...expectedFiles].sort(),
    'Candidate packages must contain exactly the current theme and UI tarballs',
  );

  const checksums = parseChecksums(await readFile(join(source, 'SHA256SUMS'), 'utf8'));
  assert.deepEqual(
    [...checksums.keys()].sort(),
    [...expectedFiles].sort(),
    'SHA256SUMS must cover exactly the current theme and UI tarballs',
  );

  const sha256 = {};
  for (const filename of expectedFiles) {
    const bytes = await readFile(join(source, filename));
    const actual = createHash('sha256').update(bytes).digest('hex');
    const expected = checksums.get(filename);
    assert.equal(actual, expected, `SHA-256 mismatch for ${filename}`);
    sha256[filename] = actual;
  }
  return { source, sha256 };
}

export async function installCandidatePackages(sourceDir, destinationDir, expectedVersions) {
  const verified = await verifyCandidatePackages(sourceDir, expectedVersions);
  const destination = resolve(destinationDir);
  await mkdir(destination, { recursive: true });
  for (const filename of Object.keys(verified.sha256))
    await copyFile(join(verified.source, filename), join(destination, filename));
  return verified;
}

if (process.argv[1] && import.meta.url === pathToFileURL(await realpath(process.argv[1])).href) {
  const sourceIndex = process.argv.indexOf('--source');
  assert.ok(
    sourceIndex > 0 && process.argv[sourceIndex + 1],
    'Usage: node scripts/candidate-packages.mjs --source <directory>',
  );
  const expectedVersions = {};
  for (const name of ['theme', 'ui']) {
    const pkg = JSON.parse(await readFile(join(root, 'packages', name, 'package.json'), 'utf8'));
    expectedVersions[name] = pkg.version;
  }
  const result = await verifyCandidatePackages(process.argv[sourceIndex + 1], expectedVersions);
  console.log(`Verified candidate packages in ${result.source}`);
  for (const [filename, hash] of Object.entries(result.sha256)) console.log(`${hash}  ${filename}`);
}
