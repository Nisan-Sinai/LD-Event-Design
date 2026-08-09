import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstagramFeedSection } from './InstagramFeedSection';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InstagramFeedSection', () => {
  it('renders media returned by the server-side Instagram endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        configured: true,
        items: [
          {
            id: 'ig-1',
            caption: 'עיצוב חופה לבנה',
            mediaType: 'IMAGE',
            imageUrl: 'https://cdn.example/instagram-1.jpg',
            permalink: 'https://www.instagram.com/p/example/',
            timestamp: '2026-08-09T18:00:00+0000'
          },
          {
            id: 'ig-2',
            caption: '',
            mediaType: 'VIDEO',
            imageUrl: 'https://cdn.example/reel.jpg',
            permalink: 'https://www.instagram.com/reel/example/',
            timestamp: '2026-08-08T18:00:00+0000'
          }
        ]
      })
    });

    render(<InstagramFeedSection />);

    await waitFor(() => expect(screen.getByRole('img', { name: 'עיצוב חופה לבנה' })).toHaveAttribute('src', 'https://cdn.example/instagram-1.jpg'));
    expect(screen.getByRole('link', { name: /פתיחת הפוסט באינסטגרם — עיצוב חופה לבנה/ })).toHaveAttribute('href', 'https://www.instagram.com/p/example/');
    expect(screen.getByText('REEL')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/instagram', expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  it('shows an honest Instagram link instead of fake product images when the API is unavailable', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    render(<InstagramFeedSection />);

    await waitFor(() => expect(screen.getByText(/עברו ישירות לעמוד האינסטגרם/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'פתיחת האינסטגרם' })).toHaveAttribute('href', expect.stringContaining('instagram.com/ld_event_design'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
