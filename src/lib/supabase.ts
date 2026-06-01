import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// האם החיבור הוגדר? (כל עוד לא הוגדר — האפליקציה ממשיכה לעבוד בלי שמירה)
export const isSupabaseConfigured = Boolean(url && anonKey);

// אם לא הוגדר, יוצרים לקוח עם ערכי דמה כדי שהאפליקציה לא תקרוס בזמן פיתוח.
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key'
);
