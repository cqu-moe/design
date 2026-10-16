import { cp, mkdir, mkdtemp, open, readFile, readdir, rename } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function describe(value, seen = new Set()) {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => describe(item, seen));
  const result = value instanceof Error ? { name: value.name } : {};
  for (const key of Object.getOwnPropertyNames(value)) result[key] = describe(value[key], seen);
  return result;
}
async function writePrivateJson(path, value) {
  const file = await open(path, 'wx', 0o600);
  try {
    await file.writeFile(JSON.stringify(value, null, 2) + '\n');
    await file.sync();
  } finally {
    await file.close();
  }
}

export async function publishAuthConsumerEvidence({
  source,
  destination,
  scan,
  failures,
  quarantineParent,
}) {
  let rejection;
  try {
    await scan(source);
  } catch (error) {
    rejection = { phase: 'scan', error };
  }
  if (!rejection) {
    try {
      await mkdir(destination);
      async function walk(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const path = join(directory, entry.name);
          if (entry.isDirectory()) await walk(path);
          else if (/\.(json|log|md|txt|png)$/.test(entry.name)) {
            const target = join(destination, relative(source, path));
            await mkdir(dirname(target), { recursive: true });
            await cp(path, target);
          }
        }
      }
      await walk(source);
      return { published: true };
    } catch (error) {
      rejection = { phase: 'publication', error };
    }
  }

  const errors = [...failures, rejection];
  const records = () => errors.map(({ phase, error }) => ({ phase, error: describe(error) }));
  let quarantine;
  let moved = false;
  let receiptSHA256;
  let errorsSHA256;
  try {
    // This journal also survives in retained work if allocating quarantine fails.
    await writePrivateJson(join(source, 'private-publication-errors.json'), records());
    quarantine = await mkdtemp(join(quarantineParent, 'auth-consumer-quarantine-'));
    // Same-filesystem rename preserves every raw file outside verification's rm(work).
    await rename(source, join(quarantine, 'raw'));
    moved = true;
    await writePrivateJson(join(quarantine, 'errors.json'), records());
    errorsSHA256 = hash(await readFile(join(quarantine, 'errors.json')));
    const files = [];
    async function inventory(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await inventory(path);
        else if (entry.isFile())
          files.push({ path: relative(quarantine, path), sha256: hash(await readFile(path)) });
        else throw new Error('Quarantine contains an unsupported raw file type');
      }
    }
    await inventory(join(quarantine, 'raw'));
    files.sort((a, b) => a.path.localeCompare(b.path));
    await writePrivateJson(join(quarantine, 'receipt.json'), { errorsSHA256, files });
    receiptSHA256 = hash(await readFile(join(quarantine, 'receipt.json')));
  } catch (error) {
    errors.push({ phase: 'quarantine', error });
    try {
      await writePrivateJson(
        join(moved ? quarantine : source, 'quarantine-failure-errors.json'),
        records(),
      );
    } catch (journalError) {
      errors.push({ phase: 'quarantine-journal', error: journalError });
    }
  }

  const summary = () => ({
    published: false,
    publication: 'rejected',
    primaryFailed: errors.some(({ phase }) => phase === 'primary'),
    cleanupFailures: errors.filter(({ phase }) => phase === 'cleanup').length,
    errors: records().map(({ phase, error }) => ({ phase, sha256: hash(JSON.stringify(error)) })),
    scanFailed: errors.some(({ phase }) => phase === 'scan'),
    rawArtifactsPublished: false,
    preserveWork: !moved,
    quarantine: {
      retained: moved,
      directory: quarantine ? basename(quarantine) : null,
      complete: receiptSHA256 !== undefined,
      ...(errorsSHA256 ? { errorsSHA256 } : {}),
      ...(receiptSHA256 ? { receiptSHA256 } : {}),
    },
    privateWorkDisposition: moved
      ? 'raw retained in private sibling quarantine'
      : 'retain private work after quarantine failure',
  });
  try {
    await mkdir(destination);
    await writePrivateJson(join(destination, 'publication-failure.json'), summary());
  } catch (error) {
    errors.push({ phase: 'publication', error });
    try {
      await writePrivateJson(
        join(moved ? quarantine : source, 'publication-failure-errors.json'),
        records(),
      );
    } catch (journalError) {
      errors.push({ phase: 'publication-journal', error: journalError });
    }
  }
  return summary();
}
