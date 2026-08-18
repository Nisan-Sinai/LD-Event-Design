import { afterEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.hoisted(() => vi.fn(() => ({ client: true })));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  createClient.mockClear();
});

describe('supabase client configuration', () => {
  it('uses configured project values when both environment variables exist', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    const module = await import('./supabase');
    expect(module.isSupabaseConfigured).toBe(true);
    expect(createClient).toHaveBeenCalledWith('https://project.supabase.co', 'anon-key');
  });

  it.each([
    [undefined, undefined, 'http://localhost:54321', 'public-anon-key'],
    ['https://project.supabase.co', undefined, 'https://project.supabase.co', 'public-anon-key'],
    [undefined, 'anon-key', 'http://localhost:54321', 'anon-key'],
    ['', '', '', '']
  ] as const)('handles incomplete configuration without reporting configured', async (url, key, clientUrl, clientKey) => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', key);
    const module = await import('./supabase');
    expect(module.isSupabaseConfigured).toBe(false);
    expect(createClient).toHaveBeenCalledWith(clientUrl, clientKey);
    vi.resetModules();
    createClient.mockClear();
  });
});
