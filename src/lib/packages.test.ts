import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({
  configured: true,
  rows: [] as Record<string, unknown>[],
  upserted: null as Record<string, unknown> | null,
  upsertOpts: null as unknown,
  deleted: null as string | null,
  selectError: null as null | { message: string },
  upsertError: null as null | { message: string },
  deleteError: null as null | { message: string },
  uploadedPath: null as string | null,
  uploadOpts: null as Record<string, unknown> | null,
  uploadError: null as null | { message: string }
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return m.configured;
  },
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: m.rows, error: m.selectError }),
      upsert: (row: Record<string, unknown>, opts: unknown) => {
        m.upserted = row;
        m.upsertOpts = opts;
        return Promise.resolve({ error: m.upsertError });
      },
      delete: () => ({
        eq: (_col: string, val: string) => {
          m.deleted = val;
          return Promise.resolve({ error: m.deleteError });
        }
      })
    }),
    storage: {
      from: () => ({
        upload: (path: string, _file: unknown, opts: Record<string, unknown>) => {
          m.uploadedPath = path;
          m.uploadOpts = opts;
          return Promise.resolve({ error: m.uploadError });
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } })
      })
    }
  }
}));

import {
  buildCatalog,
  fetchPackageOverrides,
  savePackageOverride,
  deletePackageOverride,
  uploadPackageImage,
  type PackageOverride
} from './packages';
import { PACKAGES } from '../App';

const ov = (o: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
  price: null,
  title: null,
  subtitle: null,
  description: null,
  benefits: null,
  image_url: null,
  category: null,
  svg_type: null,
  pricing_tiers: null,
  hidden: false,
  is_custom: false,
  sort_order: null,
  ...o
});

beforeEach(() => {
  m.configured = true;
  m.rows = [];
  m.upserted = null;
  m.upsertOpts = null;
  m.deleted = null;
  m.selectError = null;
  m.upsertError = null;
  m.deleteError = null;
  m.uploadedPath = null;
  m.uploadOpts = null;
  m.uploadError = null;
});

describe('buildCatalog', () => {
  it('returns the catalog unchanged when there are no overrides', () => {
    const out = buildCatalog(PACKAGES, {});
    expect(out).toHaveLength(PACKAGES.length);
    expect(out[0]).toBe(PACKAGES[0]);
  });

  it('overrides price, title, subtitle, description, benefits, image and tiers', () => {
    const out = buildCatalog(PACKAGES, {
      'classic-s': ov({ package_id: 'classic-s', price: 1234, title: 'מותאם', subtitle: 'תת', description: 'תיאור', benefits: 'הטבה', image_url: 'http://img/x.jpg', pricing_tiers: { 10: 1 } })
    });
    const p = out.find((x) => x.id === 'classic-s')!;
    expect(p.price).toBe(1234);
    expect(p.title).toBe('מותאם');
    expect(p.subtitle).toBe('תת');
    expect(p.description).toBe('תיאור');
    expect(p.benefits).toBe('הטבה');
    expect(p.image).toBe('http://img/x.jpg');
    expect(p.pricingTiers).toEqual({ 10: 1 });
  });

  it('falls back to defaults for null override fields', () => {
    const base = PACKAGES.find((x) => x.id === 'classic-m')!;
    const out = buildCatalog(PACKAGES, { 'classic-m': ov({ package_id: 'classic-m' }) });
    const p = out.find((x) => x.id === 'classic-m')!;
    expect(p.price).toBe(base.price);
    expect(p.title).toBe(base.title);
  });

  it('hides packages flagged hidden', () => {
    const out = buildCatalog(PACKAGES, { 'classic-s': ov({ package_id: 'classic-s', hidden: true }) });
    expect(out.find((x) => x.id === 'classic-s')).toBeUndefined();
    expect(out).toHaveLength(PACKAGES.length - 1);
  });

  it('maps a custom package with all-null optional fields to safe defaults', () => {
    const out = buildCatalog(PACKAGES, {
      'custom-empty': ov({ package_id: 'custom-empty', is_custom: true })
    });
    const c = out.find((x) => x.id === 'custom-empty')!;
    expect(c.title).toBe('');
    expect(c.subtitle).toBe('');
    expect(c.description).toBe('');
    expect(c.benefits).toBe('');
    expect(c.price).toBe(0);
    expect(c.category).toBe('');
    expect(c.svgType).toBe('default');
    expect(c.image).toBeUndefined();
    expect(c.pricingTiers).toBeUndefined();
  });

  it('appends custom packages (sorted), and skips hidden customs', () => {
    const out = buildCatalog(PACKAGES, {
      'custom-b': ov({ package_id: 'custom-b', is_custom: true, title: 'שני', category: 'חתונה', price: 2, sort_order: 2 }),
      'custom-a': ov({ package_id: 'custom-a', is_custom: true, title: 'ראשון', category: 'חתונה', price: 1, sort_order: 1 }),
      'custom-h': ov({ package_id: 'custom-h', is_custom: true, hidden: true, title: 'מוסתר', category: 'חתונה', price: 3 })
    });
    const customs = out.slice(PACKAGES.length);
    expect(customs.map((c) => c.id)).toEqual(['custom-a', 'custom-b']);
    expect(customs[0].title).toBe('ראשון');
    expect(out.find((x) => x.id === 'custom-h')).toBeUndefined();
  });
});

describe('packages data layer', () => {
  it('returns {} and no-ops when Supabase is not configured', async () => {
    m.configured = false;
    expect(await fetchPackageOverrides()).toEqual({});
    await savePackageOverride(ov({ package_id: 'classic-s', price: 100 }));
    await deletePackageOverride('classic-s');
    expect(m.upserted).toBeNull();
    expect(m.deleted).toBeNull();
  });

  it('maps fetched rows by package_id', async () => {
    m.rows = [{ package_id: 'classic-s', price: 1, title: null, subtitle: null, pricing_tiers: null, hidden: false }];
    const map = await fetchPackageOverrides();
    expect(map['classic-s'].price).toBe(1);
  });

  it('upserts with onConflict and an updated_at timestamp', async () => {
    await savePackageOverride(ov({ package_id: 'classic-s', price: 999 }));
    expect(m.upserted?.package_id).toBe('classic-s');
    expect(m.upserted?.price).toBe(999);
    expect(m.upserted?.updated_at).toBeTruthy();
    expect(m.upsertOpts).toEqual({ onConflict: 'package_id' });
  });

  it('deletes by package_id', async () => {
    await deletePackageOverride('classic-s');
    expect(m.deleted).toBe('classic-s');
  });

  it('throws on select / upsert / delete errors', async () => {
    m.selectError = { message: 'sel' };
    await expect(fetchPackageOverrides()).rejects.toEqual({ message: 'sel' });
    m.selectError = null;
    m.upsertError = { message: 'up' };
    await expect(savePackageOverride(ov({ package_id: 'classic-s' }))).rejects.toEqual({ message: 'up' });
    m.upsertError = null;
    m.deleteError = { message: 'del' };
    await expect(deletePackageOverride('classic-s')).rejects.toEqual({ message: 'del' });
  });
});

describe('uploadPackageImage', () => {
  const file = new File(['x'], 'Photo.PNG', { type: 'image/png' });

  it('uploads with content type and returns a public URL', async () => {
    const url = await uploadPackageImage(file);
    expect(m.uploadedPath).toMatch(/\.png$/); // הסיומת מנורמלת לאותיות קטנות
    expect(m.uploadOpts).toMatchObject({ contentType: 'image/png', upsert: false });
    expect(url).toBe(`https://cdn.example/${m.uploadedPath}`);
  });

  it('defaults the extension to jpg when the filename has none', async () => {
    await uploadPackageImage(new File(['x'], 'noext', { type: 'image/jpeg' }));
    expect(m.uploadedPath).toMatch(/\.jpg$/);
  });

  it('accepts Android images whose MIME type is missing or reported as image/jpg', async () => {
    await uploadPackageImage(new File(['x'], 'camera.JPEG', { type: '' }));
    expect(m.uploadedPath).toMatch(/\.jpg$/);
    expect(m.uploadOpts).toMatchObject({ contentType: 'image/jpeg' });

    await uploadPackageImage(new File(['x'], 'camera', { type: 'image/jpg' }));
    expect(m.uploadedPath).toMatch(/\.jpg$/);
    expect(m.uploadOpts).toMatchObject({ contentType: 'image/jpeg' });
  });

  it('resizes large phone photos before uploading them', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 4000,
      height: 3000,
      close
    }));
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(new Blob(['compressed'], { type: 'image/webp' })));

    try {
      const large = new File([new Uint8Array(9 * 1024 * 1024)], 'large-phone-photo.jpg', {
        type: 'image/jpeg'
      });
      await uploadPackageImage(large);
      expect(m.uploadedPath).toMatch(/\.webp$/);
      expect(m.uploadOpts).toMatchObject({ contentType: 'image/webp', upsert: false });
      expect(close).toHaveBeenCalled();
    } finally {
      getContext.mockRestore();
      toBlob.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('throws when Supabase is not configured', async () => {
    m.configured = false;
    await expect(uploadPackageImage(file)).rejects.toThrow(/not configured/i);
  });

  it('throws when the upload fails', async () => {
    m.uploadError = { message: 'upload failed' };
    await expect(uploadPackageImage(file)).rejects.toEqual({ message: 'upload failed' });
  });
});
