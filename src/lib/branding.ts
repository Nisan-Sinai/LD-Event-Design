import type { OverrideMap, PackageOverride } from './packages';

export const BRANDING_OVERRIDE_ID = '__site_branding__';

export function brandLogoUrl(overrides: OverrideMap): string {
  return overrides[BRANDING_OVERRIDE_ID]?.image_url?.trim() ?? '';
}

export function createBrandingOverride(imageUrl: string): PackageOverride {
  return {
    package_id: BRANDING_OVERRIDE_ID,
    price: null,
    title: 'LD Event Design logo',
    subtitle: null,
    description: null,
    benefits: null,
    image_url: imageUrl,
    category: null,
    svg_type: null,
    pricing_tiers: null,
    hidden: true,
    is_custom: false,
    sort_order: null
  };
}
