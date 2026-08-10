import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  upserted: null as Record<string, unknown> | null
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      upsert: (row: Record<string, unknown>) => {
        m.upserted = row;
        return Promise.resolve({ error: null });
      },
      delete: () => ({ eq: () => Promise.resolve({ error: null }) })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/image.webp' } })
      })
    }
  }
}));

import { PACKAGES } from '../App';
import { buildCatalog, savePackageImage, type PackageOverride } from './packages';

function override(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
  return {
    price: null,
    title: null,
    subtitle: null,
    description: null,
    benefits: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    image_url_4: null,
    category: null,
    svg_type: null,
    pricing_tiers: null,
    hidden: false,
    is_custom: false,
    sort_order: null,
    ...input
  };
}

beforeEach(() => {
  m.upserted = null;
});

describe('four image package persistence', () => {
  it('writes image slots 2, 3 and 4 to their dedicated columns', async () => {
    await savePackageImage('x', 'two', 2);
    expect(m.upserted).toMatchObject({ package_id: 'x', image_url_2: 'two' });

    await savePackageImage('x', 'three', 3);
    expect(m.upserted).toMatchObject({ package_id: 'x', image_url_3: 'three' });

    await savePackageImage('x', 'four', 4);
    expect(m.upserted).toMatchObject({ package_id: 'x', image_url_4: 'four' });
  });

  it('uses image 3 and then image 4 when earlier package image slots are empty', () => {
    const pkg = PACKAGES[0];
    const fromThird = buildCatalog(PACKAGES, {
      [pkg.id]: override({ package_id: pkg.id, image_url_3: 'third' })
    });
    expect(fromThird.find((item) => item.id === pkg.id)?.image).toBe('third');

    const fromFourth = buildCatalog(PACKAGES, {
      [pkg.id]: override({ package_id: pkg.id, image_url_4: 'fourth' })
    });
    expect(fromFourth.find((item) => item.id === pkg.id)?.image).toBe('fourth');
  });

  it('uses later image slots for custom packages too', () => {
    const result = buildCatalog(PACKAGES, {
      custom: override({
        package_id: 'custom',
        is_custom: true,
        category: 'חתונה',
        image_url_3: 'custom-third'
      })
    });
    expect(result.find((item) => item.id === 'custom')?.image).toBe('custom-third');
  });
});
