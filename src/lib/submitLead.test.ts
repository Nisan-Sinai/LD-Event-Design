import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configured: true,
  insertPayload: null as Record<string, unknown> | null,
  insertError: null as unknown,
  selectedData: { id: 'lead-1' } as { id: string },
  functionInvocations: 0
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
  supabase: {
    from: () => ({
      insert: (payload: Record<string, unknown>) => {
        state.insertPayload = payload;
        return {
          select: () => ({
            single: async () => ({ data: state.selectedData, error: state.insertError })
          })
        };
      }
    }),
    functions: {
      invoke: async () => {
        state.functionInvocations += 1;
        return { error: null };
      }
    }
  }
}));

import { submitLead } from './submitLead';

beforeEach(() => {
  state.configured = true;
  state.insertPayload = null;
  state.insertError = null;
  state.selectedData = { id: 'lead-1' };
  state.functionInvocations = 0;
});

describe('submitLead', () => {
  it('returns a generated id without network work when Supabase is not configured', async () => {
    state.configured = false;
    const random = vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');

    await expect(submitLead({
      fullName: ' Name ',
      phone: ' 050 ',
      email: '',
      estimatedEventDate: ''
    })).resolves.toEqual({ id: '11111111-1111-4111-8111-111111111111' });
    expect(state.insertPayload).toBeNull();
    expect(state.functionInvocations).toBe(0);
    random.mockRestore();
  });

  it('trims values, uses browser defaults, allows optional fields, and returns the database id without invoking an Edge Function from the browser', async () => {
    window.history.replaceState({}, '', '/lead-source');
    const result = await submitLead({
      fullName: '  לירון  ',
      phone: ' 0501234567 ',
      email: '   ',
      estimatedEventDate: ''
    });

    expect(result).toEqual({ id: 'lead-1' });
    expect(state.insertPayload).toMatchObject({
      full_name: 'לירון',
      phone: '0501234567',
      email: null,
      estimated_event_date: null,
      source: 'homepage-popup',
      page_url: window.location.href,
      user_agent: window.navigator.userAgent
    });
    expect(state.functionInvocations).toBe(0);
  });

  it('uses explicitly supplied page and user-agent values and keeps email/date', async () => {
    await submitLead({
      fullName: 'A',
      phone: 'B',
      email: ' a@example.com ',
      estimatedEventDate: '2026-09-01',
      pageUrl: 'https://example.com/custom',
      userAgent: 'qa-agent'
    });

    expect(state.insertPayload).toMatchObject({
      email: 'a@example.com',
      estimated_event_date: '2026-09-01',
      page_url: 'https://example.com/custom',
      user_agent: 'qa-agent'
    });
    expect(state.functionInvocations).toBe(0);
  });

  it('throws database errors and never invokes the notification Edge Function directly', async () => {
    state.insertError = new Error('insert failed');
    await expect(submitLead({ fullName: 'A', phone: 'B', email: '', estimatedEventDate: '' }))
      .rejects.toThrow('insert failed');
    expect(state.functionInvocations).toBe(0);
  });

  it('keeps notification dispatch server-side after a successful insert', async () => {
    await expect(submitLead({ fullName: 'A', phone: 'B', email: '', estimatedEventDate: '' }))
      .resolves.toEqual({ id: 'lead-1' });
    expect(state.insertPayload).not.toBeNull();
    expect(state.functionInvocations).toBe(0);
  });
});
