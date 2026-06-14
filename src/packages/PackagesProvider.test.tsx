import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PackageOverride } from '../lib/packages';

const m = vi.hoisted(() => ({
  fetch: vi.fn(async () => ({}) as Record<string, PackageOverride>),
  save: vi.fn(async () => {}),
  del: vi.fn(async () => {})
}));
vi.mock('../lib/packages', () => ({
  fetchPackageOverrides: m.fetch,
  savePackageOverride: m.save,
  deletePackageOverride: m.del
}));

import { PackagesProvider, usePackages } from './PackagesProvider';

const ov = (o: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
  price: null, title: null, subtitle: null, description: null, benefits: null,
  image_url: null, category: null, svg_type: null, pricing_tiers: null,
  hidden: false, is_custom: false, sort_order: null, ...o
});

const wrapper = ({ children }: { children: ReactNode }) => <PackagesProvider>{children}</PackagesProvider>;

beforeEach(() => {
  m.fetch.mockReset().mockResolvedValue({});
  m.save.mockReset().mockResolvedValue(undefined);
  m.del.mockReset().mockResolvedValue(undefined);
});

describe('PackagesProvider', () => {
  it('fetches overrides on mount', async () => {
    m.fetch.mockResolvedValue({ 'classic-s': ov({ package_id: 'classic-s', price: 1 }) });
    const { result } = renderHook(() => usePackages(), { wrapper });
    await waitFor(() => expect(result.current.overrides['classic-s']).toBeTruthy());
    expect(result.current.loading).toBe(false);
  });

  it('saveOverride persists and updates local state', async () => {
    const { result } = renderHook(() => usePackages(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.saveOverride(ov({ package_id: 'x', price: 5 }));
    });
    expect(m.save).toHaveBeenCalled();
    expect(result.current.overrides.x).toMatchObject({ package_id: 'x', price: 5 });
  });

  it('removeOverride deletes and updates local state', async () => {
    m.fetch.mockResolvedValue({ x: ov({ package_id: 'x' }) });
    const { result } = renderHook(() => usePackages(), { wrapper });
    await waitFor(() => expect(result.current.overrides.x).toBeTruthy());
    await act(async () => {
      await result.current.removeOverride('x');
    });
    expect(m.del).toHaveBeenCalledWith('x');
    expect(result.current.overrides.x).toBeUndefined();
  });

  it('keeps defaults when the fetch fails (e.g. no access)', async () => {
    m.fetch.mockRejectedValue(new Error('rls'));
    const { result } = renderHook(() => usePackages(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.overrides).toEqual({});
  });

  it('default context (no provider) is a safe no-op', () => {
    const { result } = renderHook(() => usePackages());
    expect(result.current.overrides).toEqual({});
    expect(result.current.loading).toBe(false);
  });
});
