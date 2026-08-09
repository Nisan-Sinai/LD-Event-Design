import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/render';
import { LeadCaptureModal } from './LeadCaptureModal';

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LeadCaptureModal', () => {
  it('shows a visible event-date label and right-aligns the phone field', () => {
    renderWithProviders(<LeadCaptureModal />);

    act(() => {
      vi.advanceTimersByTime(14_000);
    });

    const phone = screen.getByLabelText('טלפון');
    expect(phone).toHaveAttribute('dir', 'ltr');
    expect(phone).toHaveClass('text-right');

    const eventDate = screen.getByLabelText('תאריך האירוע');
    expect(eventDate).toHaveAttribute('type', 'date');
    expect(screen.getByText('תאריך האירוע')).toBeVisible();
  });
});
