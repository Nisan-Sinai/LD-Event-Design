import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const chunksDir = join(root, 'src', 'assets', 'promo-video');
const outputPath = join(root, 'public', 'media', 'ld-event-design-promo.mp4');
const expectedSize = 271485;
const expectedSha256 = 'cc22df57b1682b4b4398a7e80ed674fc6c20bb67624b62ad3bbf71a572e74faa';

const chunkNames = (await readdir(chunksDir))
  .filter((name) => /^chunk-\d+\.b64$/.test(name))
  .sort();

if (chunkNames.length !== 19) {
  throw new Error(`Expected 19 promo-video chunks, found ${chunkNames.length}`);
}

const base64 = (await Promise.all(chunkNames.map((name) => readFile(join(chunksDir, name), 'utf8')))).join('');
const bytes = Buffer.from(base64, 'base64');
const sha256 = createHash('sha256').update(bytes).digest('hex');

if (bytes.length !== expectedSize || sha256 !== expectedSha256) {
  throw new Error(`Promo video integrity check failed (${bytes.length} bytes, ${sha256})`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, bytes);
console.log(`Materialized LD promo video (${bytes.length} bytes)`);
