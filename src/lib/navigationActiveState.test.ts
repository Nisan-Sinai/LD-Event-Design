import { describe, expect, it } from 'vitest';
import { isBuildPackageViewportActive } from './navigationActiveState';

describe('isBuildPackageViewportActive', () => {
  it('keeps the home tab active while the user is still at the top of the home page', () => {
    expect(isBuildPackageViewportActive(720, 90, 0)).toBe(false);
    expect(isBuildPackageViewportActive(200, 90, 100)).toBe(false);
  });

  it('activates package building only after the products section reaches the header', () => {
    expect(isBuildPackageViewportActive(138, 90, 400)).toBe(true);
    expect(isBuildPackageViewportActive(139, 90, 400)).toBe(false);
  });
});
