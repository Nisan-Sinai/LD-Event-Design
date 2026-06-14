/**
 * עטיפת localStorage בטוחה: round-trip ל-JSON, ולא קורסת אם האחסון לא זמין
 * (מצב פרטי, חסימת cookies) או אם הערך השמור אינו JSON תקין.
 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* אחסון לא זמין — מתעלמים */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* אחסון לא זמין — מתעלמים */
    }
  }
};
