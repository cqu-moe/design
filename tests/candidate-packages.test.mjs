import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installCandidatePackages } from '../scripts/candidate-packages.mjs';

const versions = {
  theme: '1.1.0',
  ui: '1.1.0',
};

async function makeCandidate(parent, poisonUi = false) {
  const source = join(parent, poisonUi ? 'poisoned' : 'valid');
  const destination = join(parent, 'destination');
  await mkdir(source);
  await mkdir(destination);
  const hashes = {};
  const lines = [];
  for (const name of ['theme', 'ui']) {
    const filename = `cqu-moe-${name}-${versions[name]}.tgz`;
    const bytes = Buffer.from(`${name} candidate package\n`);
    hashes[filename] = createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(source, filename), bytes);
    lines.push(`${hashes[filename]}  ${filename}`);
  }
  await writeFile(join(source, 'SHA256SUMS'), `${lines.join('\n')}\n`);
  if (poisonUi)
    await writeFile(
      join(source, `cqu-moe-ui-${versions.ui}.tgz`),
      Buffer.from('poisoned candidate package\n'),
    );
  return { source, destination, hashes };
}

test('candidate packages are checksum-verified before installation', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'design-candidate-'));
  try {
    const { source, destination, hashes } = await makeCandidate(parent);
    const result = await installCandidatePackages(source, destination, versions);

    assert.deepEqual(result.sha256, hashes);
    for (const name of ['theme', 'ui']) {
      assert.equal(
        await readFile(join(destination, `cqu-moe-${name}-${versions[name]}.tgz`), 'utf8'),
        `${name} candidate package\n`,
      );
    }
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('a mismatched candidate tarball is rejected before installation', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'design-candidate-'));
  try {
    const { source, destination } = await makeCandidate(parent, true);
    await assert.rejects(
      installCandidatePackages(source, destination, versions),
      /SHA-256 mismatch for cqu-moe-ui-1\.1\.0\.tgz/,
    );
    assert.deepEqual(await readdir(destination), []);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
