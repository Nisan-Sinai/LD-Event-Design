import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TestimonialsCarousel } from './TestimonialsCarousel';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('TestimonialsCarousel', () => {
  it('renders the first testimonial, five stars and active dot', () => {
    render(<TestimonialsCarousel />);
    expect(screen.getByText('שני ואיתי')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'תמונת פרופיל של שני ואיתי' })).toHaveTextContent('ש״א');
    expect(screen.getByRole('img', { name: 'דירוג 5 מתוך 5' }).querySelectorAll('svg')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'הצגת ההמלצה של שני ואיתי' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('moves next, previous with wraparound, and jumps directly with dots', () => {
    render(<TestimonialsCarousel />);
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
    render(<TestimonialsCarousel />);
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('משפחת לוי')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('נועה ואלעד')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6500));
    expect(screen.getByText('שני ואיתי')).toBeInTheDocument();
  });

  it('clears the interval on unmount', () => {
    const clear = vi.spyOn(window, 'clearInterval');
    const { unmount } = render(<TestimonialsCarousel />);
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});
