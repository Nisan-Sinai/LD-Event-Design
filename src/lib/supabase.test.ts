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
    ['', ''],
    ['https://project.supabase.co', ''],
    ['', 'anon-key']
  ])('falls back safely when configuration is incomplete', async (url, key) => {
    vi.stubEnv('VITE_SUPABASE_URL', url);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', key);
    const module = await import('./supabase');
    expect(module.isSupabaseConfigured).toBe(false);
    expect(createClient).toHaveBeenCalledWith(
      url || 'http://localhost:54321',
      key || 'public-anon-key'
    );
    vi.resetModules();
    createClient.mockClear();
  });
});
