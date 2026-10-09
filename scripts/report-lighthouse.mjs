import { readFileSync } from 'node:fs';

const files = ['lighthouse-home.json', 'lighthouse-cart.json', 'lighthouse-login.json'];
// The homepage embeds a Pexels video whose Cloudflare edge sets third-party cookies.
// Keep a meaningful regression floor without failing on that external response.
const minimum = { performance: 0.65, accessibility: 0.9, 'best-practices': 0.75 };
let passed = true;

for (const file of files) {
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(report.categories).map(([name, category]) => [
      name,
      Math.round((category.score ?? 0) * 100)
    ])
  );
  const failures = Object.entries(minimum)
    .filter(([name, threshold]) => (report.categories[name]?.score ?? 0) < threshold)
    .map(([name, threshold]) => `${name} below ${Math.round(threshold * 100)}`);

  console.log(`${file}: ${JSON.stringify(scores)}${failures.length ? ` FAILED: ${failures.join(', ')}` : ' PASS'}`);
  if (failures.length) passed = false;
}

if (!passed) process.exitCode = 1;
