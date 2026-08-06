import { describe, expect, it } from 'vitest';
import { PACKAGES } from '../App';
import { buildCatalog, type PackageOverride } from './packages';

function override(input: Partial<PackageOverride> & { package_id: string }): PackageOverride {
  return {
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
    ...input
  };
}

describe('package and product separation', () => {
  it('does not append a custom small product to the package catalog', () => {
    const catalog = buildCatalog(PACKAGES, {
      'product-custom-one': override({
        package_id: 'product-custom-one',
        title: 'מוצר קטן',
        category: 'מרכזי שולחן',
        price: 250,
        is_custom: true
      }),
      'custom-package-one': override({
        package_id: 'custom-package-one',
        title: 'חבילה חדשה',
        category: 'חתונה',
        price: 3500,
        is_custom: true
      })
    });

    expect(catalog.some((item) => item.id === 'product-custom-one')).toBe(false);
    expect(catalog.some((item) => item.id === 'custom-package-one')).toBe(true);
  });
});
