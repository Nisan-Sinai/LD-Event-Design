// לוגיקת תפקידים טהורה — מופרדת מ-React לצורך בדיקות יחידה.

export type Role = 'guest' | 'customer' | 'admin';

export const DEFAULT_ADMIN_EMAILS = 'luroni704@gmail.com,nisan.sinai5@gmail.com';

/** מפענח רשימת אימיילים-מנהלים מ-env (מופרד בפסיקים, רווחים נסלחים, אותיות קטנות). */
export function parseAdminEmails(raw: string | undefined, fallback = DEFAULT_ADMIN_EMAILS): string[] {
  return (raw ?? fallback)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** קובע תפקיד לפי אימייל: ללא אימייל = אורח; אימייל ברשימת המנהלים = מנהל; אחרת לקוח. */
export function roleForEmail(email: string | null | undefined, adminEmails: string[]): Role {
  if (!email) return 'guest';
  return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer';
}
