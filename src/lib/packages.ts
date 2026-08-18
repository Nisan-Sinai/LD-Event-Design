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
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  category: string | null;
  svg_type: string | null;
  pricing_tiers: Record<number, number> | null;
  hidden: boolean;
  is_custom: boolean;
  sort_order: number | null;
}

export interface SaveOverrideOptions {
  /** Only creation flows should include image fields in a full-row upsert. */
  includeImage?: boolean;
}

export type OverrideMap = Record<string, PackageOverride>;

const COLS =
  'package_id,price,title,subtitle,description,benefits,image_url,image_url_2,image_url_3,image_url_4,category,svg_type,pricing_tiers,hidden,is_custom,sort_order';

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
  'image/heif-sequence': 'heif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-tiff': 'tiff',
  'image/jxl': 'jxl',
  'image/vnd.microsoft.icon': 'ico',
  'image/x-icon': 'ico'
};

const FILE_EXTENSIONS: Record<string, string> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  heic: 'heic',
  heif: 'heif',
  heics: 'heic',
  heifs: 'heif',
  gif: 'gif',
  bmp: 'bmp',
  tif: 'tiff',
  tiff: 'tiff',
  jxl: 'jxl',
  ico: 'ico'
};

const BLOCKED_IMAGE_MIME_TYPES = new Set([
  'image/svg+xml',
  'image/svg',
  'text/xml',
  'application/xml'
]);

const BLOCKED_FILE_EXTENSIONS = new Set(['svg', 'svgz', 'xml', 'html', 'htm']);

const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  jxl: 'image/jxl',
  ico: 'image/x-icon'
};

interface PreparedPackageImage {
  body: Blob;
  extension: string;
  contentType: string;
}

function rawFileExtension(name: string): string | undefined {
  const candidate = name.split('.').pop()?.trim().toLowerCase();
  if (!candidate || BLOCKED_FILE_EXTENSIONS.has(candidate)) return undefined;
  return /^[a-z0-9]{1,10}$/.test(candidate) ? candidate : undefined;
}

function knownExtensionFromFileName(name: string): string | undefined {
  const candidate = rawFileExtension(name);
  return candidate ? FILE_EXTENSIONS[candidate] : undefined;
}

function extensionFromMimeType(mimeType: string): string | undefined {
  const known = IMAGE_EXTENSIONS[mimeType];
  if (known) return known;
  if (!mimeType.startsWith('image/')) return undefined;

  const subtype = mimeType.slice('image/'.length).split(';')[0]?.trim().toLowerCase();
  if (!subtype || subtype.includes('svg') || subtype.includes('xml')) return undefined;
  const simple = subtype.replace(/^x-/, '').split('+')[0];
  return /^[a-z0-9.-]{1,20}$/.test(simple) ? simple.replace(/[^a-z0-9]/g, '').slice(0, 10) || undefined : undefined;
}

export function validatePackageImage(file: File): string {
  if (file.size <= 0) throw new Error('Image file is empty');
  if (file.size > MAX_SOURCE_IMAGE_BYTES) throw new Error('Image file is larger than 30 MB');

  const mimeType = file.type.trim().toLowerCase();
  if (BLOCKED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error('SVG/XML images are not allowed for security reasons');
  }

  const fileExtension = rawFileExtension(file.name);
  const knownFileExtension = knownExtensionFromFileName(file.name);
  const isGenericMime = mimeType === '' || mimeType === 'application/octet-stream';

  if (isGenericMime) {
    if (!knownFileExtension) throw new Error('Unsupported image format');
    return knownFileExtension;
  }

  if (!mimeType.startsWith('image/')) throw new Error('Unsupported image format');

  const extension = IMAGE_EXTENSIONS[mimeType] ?? fileExtension ?? extensionFromMimeType(mimeType);
  if (!extension || BLOCKED_FILE_EXTENSIONS.has(extension)) throw new Error('Unsupported image format');
  return extension;
}

function encodeCanvasAs(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Image conversion to ${type} failed`))),
      type,
      quality
    );
  });
}

async function encodeCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  try {
    return await encodeCanvasAs(canvas, 'image/webp', quality);
  } catch {
    return encodeCanvasAs(canvas, 'image/jpeg', quality);
  }
}

async function loadImageElement(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = objectUrl;

  try {
    if (typeof image.decode === 'function') {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Browser could not decode the selected image'));
      });
    }
    return { image, objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function imageToCanvas(file: File): Promise<{ canvas: HTMLCanvasElement; cleanup: () => void }> {
  let source: CanvasImageSource;
  let width = 0;
  let height = 0;
  let bitmap: ImageBitmap | undefined;
  let objectUrl: string | undefined;

  try {
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file);
        source = bitmap;
        width = bitmap.width;
        height = bitmap.height;
      } catch {
        const loaded = await loadImageElement(file);
        source = loaded.image;
        width = loaded.image.naturalWidth;
        height = loaded.image.naturalHeight;
        objectUrl = loaded.objectUrl;
      }
    } else {
      const loaded = await loadImageElement(file);
      source = loaded.image;
      width = loaded.image.naturalWidth;
      height = loaded.image.naturalHeight;
      objectUrl = loaded.objectUrl;
    }

    const largestSide = Math.max(width, height);
    if (largestSide <= 0) throw new Error('Image dimensions are invalid');

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image conversion is unavailable');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    return {
      canvas,
      cleanup: () => {
        bitmap?.close();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    };
  } catch (error) {
    bitmap?.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function preparePackageImage(file: File): Promise<PreparedPackageImage> {
  const extension = validatePackageImage(file);
  const mimeType = file.type.trim().toLowerCase();
  const needsConversion =
    file.size > MAX_UPLOAD_IMAGE_BYTES || extension === 'heic' || extension === 'heif';

  if (!needsConversion) {
    return {
      body: file,
      extension,
      contentType: mimeType || UPLOAD_CONTENT_TYPES[extension] || 'application/octet-stream'
    };
  }

  let cleanup = () => {};
  try {
    const converted = await imageToCanvas(file);
    cleanup = converted.cleanup;

    let quality = 0.86;
    let body = await encodeCanvas(converted.canvas, quality);
    while (body.size > MAX_UPLOAD_IMAGE_BYTES && quality > 0.46) {
      quality -= 0.1;
      body = await encodeCanvas(converted.canvas, quality);
    }
    if (body.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new Error('Image is still too large after resizing');
    }

    const convertedExtension = IMAGE_EXTENSIONS[body.type] ?? (body.type === 'image/jpeg' ? 'jpg' : 'webp');
    return {
      body,
      extension: convertedExtension,
      contentType: UPLOAD_CONTENT_TYPES[convertedExtension] ?? body.type
    };
  } catch {
    // Some mobile browsers can select formats they cannot decode through createImageBitmap/canvas
    // (notably HEIC/HEIF). Saving the original is preferable to failing before Supabase receives it.
    return {
      body: file,
      extension,
      contentType: mimeType || UPLOAD_CONTENT_TYPES[extension] || 'application/octet-stream'
    };
  } finally {
    cleanup();
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

export async function savePackageOverride(
  o: PackageOverride,
  options: SaveOverrideOptions = {}
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Images are auto-saved separately. Excluding every image field from ordinary edits prevents
  // a stale admin tab/session from overwriting newer gallery images with null or an old URL.
  const payload: Record<string, unknown> = { ...o };
  if (!options.includeImage) {
    delete payload.image_url;
    delete payload.image_url_2;
    delete payload.image_url_3;
    delete payload.image_url_4;
  }

  const { error } = await supabase
    .from('package_overrides')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'package_id' });
  if (error) throw error;
}

export async function savePackageImage(
  packageId: string,
  imageUrl: string | null,
  slot: 1 | 2 | 3 | 4 = 1
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const column = slot === 1
    ? 'image_url'
    : slot === 2
      ? 'image_url_2'
      : slot === 3
        ? 'image_url_3'
        : 'image_url_4';
  const { error } = await supabase
    .from('package_overrides')
    .upsert(
      { package_id: packageId, [column]: imageUrl, updated_at: new Date().toISOString() },
      { onConflict: 'package_id' }
    );
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

function firstImage(o: PackageOverride): string | undefined {
  return o.image_url ?? o.image_url_2 ?? o.image_url_3 ?? o.image_url_4 ?? undefined;
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
    image: firstImage(o),
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
        image: firstImage(o) ?? p.image,
        pricingTiers: o.pricing_tiers ?? p.pricingTiers
      };
    });

  const customs = Object.values(overrides)
    .filter((o) => o.is_custom && !o.package_id.startsWith('product-') && !o.hidden)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(customToPackage);

  return [...base, ...customs];
}
