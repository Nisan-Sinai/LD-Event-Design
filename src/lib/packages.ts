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

const MAX_SOURCE_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/heic-sequence': 'heic',
  'image/heif-sequence': 'heif'
};

const FILE_EXTENSIONS: Record<string, string> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  heic: 'heic',
  heif: 'heif'
};

const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif'
};

interface PreparedPackageImage {
  body: Blob;
  extension: string;
  contentType: string;
}

function extensionFromFileName(name: string): string | undefined {
  const candidate = name.split('.').pop()?.trim().toLowerCase();
  return candidate ? FILE_EXTENSIONS[candidate] : undefined;
}

export function validatePackageImage(file: File): string {
  if (file.size <= 0) throw new Error('Image file is empty');
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error('Image file is larger than 30 MB');

  const mimeType = file.type.trim().toLowerCase();
  const mayUseFileName = mimeType === '' || mimeType === 'application/octet-stream';
  const extension = IMAGE_EXTENSIONS[mimeType] ?? (mayUseFileName ? extensionFromFileName(file.name) : undefined);
  if (!extension) throw new Error('Unsupported image format');
  return extension;
}

function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image conversion failed'))),
      'image/webp',
      quality
    );
  });
}

async function preparePackageImage(file: File): Promise<PreparedPackageImage> {
  const extension = validatePackageImage(file);
  const needsConversion =
    file.size > MAX_UPLOAD_IMAGE_BYTES || extension === 'heic' || extension === 'heif';

  if (!needsConversion) {
    return {
      body: file,
      extension,
      contentType: UPLOAD_CONTENT_TYPES[extension]
    };
  }

  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot resize the selected image');
  }

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const largestSide = Math.max(bitmap.width, bitmap.height);
    if (largestSide <= 0) throw new Error('Image dimensions are invalid');

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image conversion is unavailable');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.86;
    let body = await encodeCanvas(canvas, quality);
    while (body.size > MAX_UPLOAD_IMAGE_BYTES && quality > 0.46) {
      quality -= 0.1;
      body = await encodeCanvas(canvas, quality);
    }
    if (body.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new Error('Image is still too large after resizing');
    }

    const convertedExtension = IMAGE_EXTENSIONS[body.type] ?? 'webp';
    return {
      body,
      extension: convertedExtension,
      contentType: UPLOAD_CONTENT_TYPES[convertedExtension] ?? 'image/webp'
    };
  } finally {
    bitmap?.close();
  }
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
  const prepared = await preparePackageImage(file);
  const path = `${crypto.randomUUID()}.${prepared.extension}`;
  const { error } = await supabase.storage
    .from('package-images')
    .upload(path, prepared.body, {
      contentType: prepared.contentType,
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
