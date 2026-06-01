// כלי עזר: מריץ קובץ SQL מול פרויקט Supabase דרך ה-Management API.
// שימוש:  SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/run-sql.cjs <file.sql>
const fs = require('fs');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF;
const file = process.argv[2];

if (!token || !ref || !file) {
  console.error('Missing SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF / file arg');
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');

(async () => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const text = await res.text();
  console.log('HTTP', res.status);
  console.log(text);
  if (!res.ok) process.exit(1);
})();
