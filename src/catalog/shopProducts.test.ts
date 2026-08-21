import { describe, expect, it } from 'vitest';
import type { PackageOverride } from '../lib/packages';
import {
  buildShopProducts,
  productFromOverride,
  SHOP_PRODUCTS,
  SHOP_PRODUCT_CATEGORIES
} from './shopProducts';

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

describe('shopProducts', () => {
  it('returns the base product catalog when there are no overrides', () => {
    expect(buildShopProducts({})).toEqual(SHOP_PRODUCTS);
  });

  it('applies editable title, subtitle, price, image, category and illustration fields', () => {
    const first = SHOP_PRODUCTS[0];
    const products = buildShopProducts({
      [first.id]: override({
        package_id: first.id,
        title: 'מוצר מעודכן',
        subtitle: 'תיאור מעודכן',
        price: 777,
        image_url: 'https://cdn.example/product.webp',
        category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
        svg_type: 'entrance'
      })
    });

    expect(products.find((product) => product.id === first.id)).toMatchObject({
      id: first.id,
      title: 'מוצר מעודכן',
      subtitle: 'תיאור מעודכן',
      price: 777,
      image: 'https://cdn.example/product.webp',
      category: SHOP_PRODUCT_CATEGORIES.ENTRANCE,
      svgType: 'entrance'
    });
  });

  it('keeps base values when override fields are null', () => {
    const first = SHOP_PRODUCTS[0];
    const products = buildShopProducts({ [first.id]: override({ package_id: first.id }) });
    expect(products[0]).toEqual(first);
  });

  it('removes hidden products from the public shop', () => {
    const first = SHOP_PRODUCTS[0];
    const products = buildShopProducts({
      [first.id]: override({ package_id: first.id, hidden: true })
    });
    expect(products.some((product) => product.id === first.id)).toBe(false);
  });

  it('moves a product to the selected position inside its category', () => {
    const centerpieces = SHOP_PRODUCTS.filter((product) => product.category === SHOP_PRODUCT_CATEGORIES.CENTERPIECES);
    const moved = centerpieces[2];
    const products = buildShopProducts({
      [moved.id]: override({
        package_id: moved.id,
        category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
        sort_order: 1
      })
    });
    const orderedCenterpieces = products.filter((product) => product.category === SHOP_PRODUCT_CATEGORIES.CENTERPIECES);
    expect(orderedCenterpieces[0].id).toBe(moved.id);
  });

  it('adds visible custom products in sort order and ignores custom packages', () => {
    const products = buildShopProducts({
      'product-custom-late': override({
        package_id: 'product-custom-late',
        title: 'מאוחר',
        price: 200,
        category: SHOP_PRODUCT_CATEGORIES.CHUPPAH,
        is_custom: true,
        sort_order: 20
      }),
      'product-custom-first': override({
        package_id: 'product-custom-first',
        title: 'ראשון',
        price: 100,
        category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
        is_custom: true,
        sort_order: 10
      }),
      'product-custom-hidden': override({
        package_id: 'product-custom-hidden',
        title: 'מוסתר',
        is_custom: true,
        hidden: true
      }),
      'custom-package': override({
        package_id: 'custom-package',
        title: 'חבילה ולא מוצר',
        is_custom: true
      })
    });

    const custom = products.filter((product) => product.id.startsWith('product-custom-'));
    expect(custom.map((product) => product.id)).toEqual(['product-custom-first', 'product-custom-late']);
  });

  it('builds a safe custom product from a sparse override', () => {
    expect(productFromOverride(override({ package_id: 'product-custom-1', is_custom: true }))).toEqual({
      id: 'product-custom-1',
      category: SHOP_PRODUCT_CATEGORIES.CENTERPIECES,
      title: '',
      subtitle: '',
      price: 0,
      image: undefined,
      svgType: 'default'
    });
  });
});