import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchPackageOverrides,
  savePackageOverride,
  savePackageImage,
  deletePackageOverride,
  type OverrideMap,
  type PackageOverride,
  type SaveOverrideOptions
} from '../lib/packages';

interface PackagesValue {
  /** דריסות קטלוג שנשמרו ב-DB (מחיר/טקסט/הסתרה לכלל הלקוחות) */
  overrides: OverrideMap;
  loading: boolean;
  refresh: () => Promise<void>;
  saveOverride: (o: PackageOverride, options?: SaveOverrideOptions) => Promise<void>;
  saveImage: (packageId: string, imageUrl: string | null, slot?: 1 | 2) => Promise<void>;
  removeOverride: (packageId: string) => Promise<void>;
}

// ברירת המחדל ריקה — כך שקומפוננטות עובדות גם בלי Provider (בדיקות / מצב לא מוגדר).
const PackagesContext = createContext<PackagesValue>({
  overrides: {},
  loading: false,
  refresh: async () => {},
  saveOverride: async () => {},
  saveImage: async () => {},
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

  const saveOverride = useCallback(async (o: PackageOverride, options?: SaveOverrideOptions) => {
    await savePackageOverride(o, options);
    await refresh();
  }, [refresh]);

  const saveImage = useCallback(async (packageId: string, imageUrl: string | null, slot: 1 | 2 = 1) => {
    if (slot === 1) await savePackageImage(packageId, imageUrl);
    else await savePackageImage(packageId, imageUrl, 2);
    await refresh();
  }, [refresh]);

  const removeOverride = useCallback(async (packageId: string) => {
    await deletePackageOverride(packageId);
    await refresh();
  }, [refresh]);

  return (
    <PackagesContext.Provider value={{ overrides, loading, refresh, saveOverride, saveImage, removeOverride }}>
      {children}
    </PackagesContext.Provider>
  );
}

export function usePackages(): PackagesValue {
  return useContext(PackagesContext);
}
