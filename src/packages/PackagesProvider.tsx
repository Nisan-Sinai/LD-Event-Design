import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchPackageOverrides,
  savePackageOverride,
  deletePackageOverride,
  type OverrideMap,
  type PackageOverride
} from '../lib/packages';

interface PackagesValue {
  /** דריסות קטלוג שנשמרו ב-DB (מחיר/טקסט/הסתרה לכלל הלקוחות) */
  overrides: OverrideMap;
  loading: boolean;
  refresh: () => Promise<void>;
  saveOverride: (o: PackageOverride) => Promise<void>;
  removeOverride: (packageId: string) => Promise<void>;
}

// ברירת המחדל ריקה — כך שקומפוננטות עובדות גם בלי Provider (בדיקות / מצב לא מוגדר).
const PackagesContext = createContext<PackagesValue>({
  overrides: {},
  loading: false,
  refresh: async () => {},
  saveOverride: async () => {},
  removeOverride: async () => {}
});

export function PackagesProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setOverrides(await fetchPackageOverrides());
    } catch {
      /* אין גישה / Supabase לא מוגדר — נשארים עם ברירות המחדל */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveOverride = useCallback(async (o: PackageOverride) => {
    await savePackageOverride(o);
    setOverrides((prev) => ({ ...prev, [o.package_id]: o }));
  }, []);

  const removeOverride = useCallback(async (packageId: string) => {
    await deletePackageOverride(packageId);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[packageId];
      return next;
    });
  }, []);

  return (
    <PackagesContext.Provider value={{ overrides, loading, refresh, saveOverride, removeOverride }}>
      {children}
    </PackagesContext.Provider>
  );
}

export function usePackages(): PackagesValue {
  return useContext(PackagesContext);
}
