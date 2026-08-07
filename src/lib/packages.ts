import { supabase, isSupabaseConfigured } from './supabase';
import type { Package } from '../App';

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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
};

export function validatePackageImage(file: File): string {
  if (file.size <= 0) throw new Error('Image file is empty');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image file is larger than 8 MB');
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) throw new Error('Unsupported image format');
  return extension;
}

export async function fetchPackageOverrides(): Promise<OverrideMap> {
  if (!isSupabaseConfigured) return {};
  const { data, error } = await supabase.from('package_overrides').select(COLS);
  if (error) throw error;
  const map: OverrideMap = {};
  for (const row of (data ?? []) as PackageOverride[]) map[row.package_id] = row;
  return map;
}

export async function savePackageOverride(o: PackageOverride): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('package_overrides')
    .upsert({ ...o, updated_at: new Date().toISOString() }, { onConflict: 'package_id' });
  if (error) throw error;
}

export async function deletePackageOverride(packageId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('package_overrides').delete().eq('package_id', packageId);
  if (error) throw error;
}

export async function uploadPackageImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const extension = validatePackageImage(file);
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from('package-images')
    .upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false
    });
  if (error) throw error;
  return supabase.storage.from('package-images').getPublicUrl(path).data.publicUrl;
}

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
