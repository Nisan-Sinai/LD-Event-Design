import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ProductCategoryManagerPortal } from '../components/ProductCategoryManagerPortal';
import { normalizeProductCategoryOverrides, syncShopProductCategories } from '../catalog/shopProducts';
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
  saveImage: (packageId: string, imageUrl: string | null, slot?: 1 | 2 | 3 | 4) => Promise<void>;
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
  const [rawOverrides, setRawOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const refreshGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    try {
      const next = await fetchPackageOverrides();
      // Several image slots can be saved almost simultaneously on mobile. An older GET may finish
      // after a newer GET and must never replace the newer gallery state with a stale snapshot.
      if (generation === refreshGeneration.current) setRawOverrides(next);
    } catch {
      /* אין גישה / Supabase לא מוגדר — נשארים עם ברירות המחדל */
    } finally {
      if (generation === refreshGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveOverride = useCallback(async (o: PackageOverride, options?: SaveOverrideOptions) => {
    await savePackageOverride(o, options);
    await refresh();
  }, [refresh]);

  const saveImage = useCallback(async (
    packageId: string,
    imageUrl: string | null,
    slot: 1 | 2 | 3 | 4 = 1
  ) => {
    await savePackageImage(packageId, imageUrl, slot);
    await refresh();
  }, [refresh]);

  const removeOverride = useCallback(async (packageId: string) => {
    await deletePackageOverride(packageId);
    await refresh();
  }, [refresh]);

  syncShopProductCategories(rawOverrides);
  const overrides = normalizeProductCategoryOverrides(rawOverrides);

  return (
    <PackagesContext.Provider value={{ overrides, loading, refresh, saveOverride, saveImage, removeOverride }}>
      {children}
      <ProductCategoryManagerPortal />
    </PackagesContext.Provider>
  );
}

export function usePackages(): PackagesValue {
  return useContext(PackagesContext);
}
