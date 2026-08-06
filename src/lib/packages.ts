import { supabase, isSupabaseConfigured } from './supabase';
import type { Package } from '../App';

/**
 * דריסה/תוספת קטלוג (נשמרת ב-DB, חלה על כל הלקוחות).
 * עבור חבילה קיימת — שדה null פירושו "ערך ברירת המחדל".
 * עבור חבילה חדשה (is_custom) — השדות מגדירים את החבילה במלואה.
 */
export interface PackageOverride {
  package_id: string;
  price: number | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  benefits: string | null;
  image_url: string | null;
  category: string | null;
  svg_type: string | null;
  pricing_tiers: Record<number, number> | null;
  hidden: boolean;
  is_custom: boolean;
  sort_order: number | null;
}

export type OverrideMap = Record<string, PackageOverride>;

const COLS =
  'package_id,price,title,subtitle,description,benefits,image_url,category,svg_type,pricing_tiers,hidden,is_custom,sort_order';

/** שולף את כל דריסות/תוספות הקטלוג מ-Supabase (קריאה ציבורית). */
export async function fetchPackageOverrides(): Promise<OverrideMap> {
  if (!isSupabaseConfigured) return {};
  const { data, error } = await supabase.from('package_overrides').select(COLS);
  if (error) throw error;
  const map: OverrideMap = {};
  for (const row of (data ?? []) as PackageOverride[]) map[row.package_id] = row;
  return map;
}

/** שומר/מעדכן דריסה או חבילה חדשה (מנהל בלבד — נאכף ב-RLS). */
export async function savePackageOverride(o: PackageOverride): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('package_overrides')
    .upsert({ ...o, updated_at: new Date().toISOString() }, { onConflict: 'package_id' });
  if (error) throw error;
}

/** מוחק דריסה/חבילה (החזרה לברירת מחדל לקיימת, מחיקה מלאה לחדשה). */
export async function deletePackageOverride(packageId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('package_overrides').delete().eq('package_id', packageId);
  if (error) throw error;
}

/** מעלה תמונת חבילה ל-Storage ומחזיר כתובת ציבורית. */
export async function uploadPackageImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('package-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('package-images').getPublicUrl(path).data.publicUrl;
}

/** ממיר שורת חבילה-חדשה לאובייקט Package לתצוגה. */
function customToPackage(o: PackageOverride): Package {
  return {
    id: o.package_id,
    category: (o.category ?? '') as Package['category'],
    title: o.title ?? '',
    subtitle: o.subtitle ?? '',
    price: o.price ?? 0,
    description: o.description ?? '',
    benefits: o.benefits ?? '',
    details: {},
    svgType: o.svg_type ?? 'default',
    image: o.image_url ?? undefined,
    pricingTiers: o.pricing_tiers ?? undefined
  };
}

/**
 * בונה את קטלוג החבילות האפקטיבי: חבילות הבסיס לאחר דריסות,
 * בתוספת חבילות חדשות שנוצרו בניהול. מוצרים קטנים נשארים בקטלוג המוצרים בלבד.
 */
export function buildCatalog(packages: Package[], overrides: OverrideMap): Package[] {
  const base = packages
    .filter((p) => !overrides[p.id]?.hidden)
    .map((p) => {
      const o = overrides[p.id];
      if (!o) return p;
      return {
        ...p,
        price: o.price ?? p.price,
        title: o.title ?? p.title,
        subtitle: o.subtitle ?? p.subtitle,
        description: o.description ?? p.description,
        benefits: o.benefits ?? p.benefits,
        image: o.image_url ?? p.image,
        pricingTiers: o.pricing_tiers ?? p.pricingTiers
      };
    });

  const customs = Object.values(overrides)
    .filter((o) => o.is_custom && !o.package_id.startsWith('product-') && !o.hidden)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(customToPackage);

  return [...base, ...customs];
}
