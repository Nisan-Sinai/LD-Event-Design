// כלי עזר: פורס Edge Function ל-Supabase דרך ה-Management API (בלי CLI).
// שימוש:  SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/deploy-function.cjs <slug> <entryfile>
const fs = require('fs');
const path = require('path');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const slug = process.argv[2];
const entry = process.argv[3];

if (!token || !ref || !slug || !entry) {
  console.error('Missing token/ref/slug/entry');
  process.exit(1);
}

const code = fs.readFileSync(entry, 'utf8');
const fileName = path.basename(entry);

(async () => {
  const fd = new FormData();
  fd.append(
    'metadata',
    new Blob([JSON.stringify({ name: slug, entrypoint_path: fileName, verify_jwt: false })], {
      type: 'application/json'
    })
  );
  fd.append('file', new Blob([code], { type: 'application/typescript' }), fileName);

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/deploy?slug=${slug}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  console.log('HTTP', res.status);
  console.log(await res.text());
  if (!res.ok) process.exit(1);
})();
