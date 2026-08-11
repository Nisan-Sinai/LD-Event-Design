import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'src', 'assets', 'promo-video.b64');
const outputPath = join(root, 'public', 'media', 'ld-event-design-promo.mp4');
const expectedSize = 115907;
const expectedSha256 = '343a4aff43470ebaf8a556c4df94fa42a590162cc964469dfd0ae41885a945b0';

const base64 = (await readFile(sourcePath, 'utf8')).trim();
const bytes = Buffer.from(base64, 'base64');
const sha256 = createHash('sha256').update(bytes).digest('hex');

if (bytes.length !== expectedSize || sha256 !== expectedSha256) {
  throw new Error(`Promo video integrity check failed (${bytes.length} bytes, ${sha256})`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, bytes);
console.log(`Materialized LD promo video (${bytes.length} bytes)`);
