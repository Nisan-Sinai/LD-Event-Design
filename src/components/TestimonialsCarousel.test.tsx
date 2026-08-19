import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n/i18n';
import { TestimonialsCarousel } from './TestimonialsCarousel';

function renderCarousel() {
  return render(<I18nProvider><TestimonialsCarousel /></I18nProvider>);
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.removeItem('ld-lang');
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('TestimonialsCarousel', () => {
  it('renders the first testimonial, five stars and active dot', () => {
    renderCarousel();
    expect(screen.getByText('שני ואיתי')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'תמונת פרופיל של שני ואיתי' })).toHaveTextContent('ש״א');
    expect(screen.getByRole('img', { name: 'דירוג 5 מתוך 5' }).querySelectorAll('svg')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'הצגת ההמלצה של שני ואיתי' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves next, previous with wraparound, and jumps directly with dots', () => {
    renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'המלצה הבאה' }));
    expect(screen.getByText('משפחת לוי')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'המלצה קודמת' }));
    expect(screen.getByText('שני ואיתי')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'המלצה קודמת' }));
    expect(screen.getByText('נועה ואלעד')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'הצגת ההמלצה של משפחת לוי' }));
    expect(screen.getByText('משפחת לוי')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הצגת ההמלצה של משפחת לוי' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('auto-advances every 6.5 seconds and wraps after the last testimonial', () => {
    renderCarousel();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('משפחת לוי')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('נועה ואלעד')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('שני ואיתי')).toBeInTheDocument();
  });

  it('clears the interval on unmount', () => {
    const clear = vi.spyOn(window, 'clearInterval');
    const { unmount } = renderCarousel();
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});
