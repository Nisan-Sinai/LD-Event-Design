import { describe, expect, it } from 'vitest';
import { PACKAGES } from '../App';
import { buildShopProducts, SHOP_PRODUCTS } from '../catalog/shopProducts';
import { buildCatalog, type PackageOverride } from './packages';

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

describe('catalog image fallback', () => {
  it('shows image 2 for a product when image 1 was deleted', () => {
    const product = SHOP_PRODUCTS[0];
    const secondaryUrl = 'https://cdn.example/product-secondary.webp';
    const result = buildShopProducts({
      [product.id]: override({
        package_id: product.id,
        image_url: null,
        image_url_2: secondaryUrl
      })
    });

    expect(result.find((item) => item.id === product.id)?.image).toBe(secondaryUrl);
  });

  it('falls through image 2 to image 3 and image 4', () => {
    const product = SHOP_PRODUCTS[0];
    const thirdUrl = 'https://cdn.example/product-third.webp';
    const fourthUrl = 'https://cdn.example/product-fourth.webp';

    const thirdResult = buildShopProducts({
      [product.id]: override({
        package_id: product.id,
        image_url_3: thirdUrl,
        image_url_4: fourthUrl
      })
    });
    expect(thirdResult.find((item) => item.id === product.id)?.image).toBe(thirdUrl);

    const fourthResult = buildShopProducts({
      [product.id]: override({
        package_id: product.id,
        image_url_4: fourthUrl
      })
    });
    expect(fourthResult.find((item) => item.id === product.id)?.image).toBe(fourthUrl);
  });

  it('shows image 2 for a package when image 1 was deleted', () => {
    const pkg = PACKAGES[0];
    const secondaryUrl = 'https://cdn.example/package-secondary.webp';
    const result = buildCatalog(PACKAGES, {
      [pkg.id]: override({
        package_id: pkg.id,
        image_url: null,
        image_url_2: secondaryUrl
      })
    });

    expect(result.find((item) => item.id === pkg.id)?.image).toBe(secondaryUrl);
  });

  it('keeps image 1 as the preferred image when all four images exist', () => {
    const product = SHOP_PRODUCTS[0];
    const result = buildShopProducts({
      [product.id]: override({
        package_id: product.id,
        image_url: 'https://cdn.example/primary.webp',
        image_url_2: 'https://cdn.example/secondary.webp',
        image_url_3: 'https://cdn.example/third.webp',
        image_url_4: 'https://cdn.example/fourth.webp'
      })
    });

    expect(result.find((item) => item.id === product.id)?.image).toBe('https://cdn.example/primary.webp');
  });
});
