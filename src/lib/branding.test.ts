import { describe, expect, it } from 'vitest';
import { BRANDING_OVERRIDE_ID, brandLogoUrl, createBrandingOverride } from './branding';

describe('branding', () => {
  it('returns an empty logo when no branding override exists', () => {
    expect(brandLogoUrl({})).toBe('');
  });

  it('normalizes and creates the hidden branding override', () => {
    const override = createBrandingOverride(' https://cdn.example/logo.png ');
    expect(override).toMatchObject({
      package_id: BRANDING_OVERRIDE_ID,
      image_url: ' https://cdn.example/logo.png ',
      hidden: true,
      is_custom: false
    });
    expect(brandLogoUrl({ [BRANDING_OVERRIDE_ID]: override })).toBe('https://cdn.example/logo.png');
  });
});
