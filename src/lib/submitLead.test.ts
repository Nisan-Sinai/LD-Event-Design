import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configured: true,
  insertPayload: null as Record<string, unknown> | null,
  insertError: null as unknown,
  selectedData: { id: 'lead-1' } as { id: string },
  notifyError: null as unknown,
  notifyBody: null as unknown
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
      invoke: async (_name: string, options: { body: unknown }) => {
        state.notifyBody = options.body;
        return { error: state.notifyError };
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
  state.notifyError = null;
  state.notifyBody = null;
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
    random.mockRestore();
  });

  it('trims values, uses browser defaults, allows optional fields, notifies, and returns the database id', async () => {
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
    expect(state.notifyBody).toEqual({
      lead: {
        id: 'lead-1',
        fullName: 'לירון',
        phone: '0501234567',
        email: '',
        estimatedEventDate: ''
      }
    });
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
  });

  it('throws database errors before notification', async () => {
    state.insertError = new Error('insert failed');
    await expect(submitLead({ fullName: 'A', phone: 'B', email: '', estimatedEventDate: '' }))
      .rejects.toThrow('insert failed');
    expect(state.notifyBody).toBeNull();
  });

  it('throws notification errors after a successful insert', async () => {
    state.notifyError = new Error('notify failed');
    await expect(submitLead({ fullName: 'A', phone: 'B', email: '', estimatedEventDate: '' }))
      .rejects.toThrow('notify failed');
    expect(state.insertPayload).not.toBeNull();
  });
});
