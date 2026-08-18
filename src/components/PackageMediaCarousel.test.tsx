import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PackageMediaCarousel } from './PackageMediaCarousel';

describe('PackageMediaCarousel', () => {
  it('renders only artwork when no uploaded media exists', () => {
    render(<PackageMediaCarousel title="חבילה" art={<span>ART</span>} />);
    expect(screen.getByRole('img', { name: 'המחשת עיצוב חבילה' })).toHaveTextContent('ART');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an image plus artwork and wraps in both navigation directions', () => {
    render(<PackageMediaCarousel title="חבילה" mediaUrl="https://example.com/photo.JPG?x=1" art={<span>ART</span>} />);
    expect(screen.getByRole('img', { name: 'חבילה' })).toHaveAttribute('src', 'https://example.com/photo.JPG?x=1');
    const previous = screen.getByRole('button', { name: 'תמונה קודמת של חבילה' });
    const next = screen.getByRole('button', { name: 'תמונה הבאה של חבילה' });
    const firstDot = screen.getByRole('button', { name: 'מעבר למדיה 1 של חבילה' });
    const secondDot = screen.getByRole('button', { name: 'מעבר למדיה 2 של חבילה' });
    expect(firstDot).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(previous);
    expect(screen.getByRole('img', { name: 'המחשת עיצוב חבילה' })).toHaveTextContent('ART');
    expect(secondDot).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(next);
    expect(screen.getByRole('img', { name: 'חבילה' })).toBeInTheDocument();
    fireEvent.click(secondDot);
    expect(screen.getByRole('img', { name: 'המחשת עיצוב חבילה' })).toBeInTheDocument();
    fireEvent.click(firstDot);
    expect(screen.getByRole('img', { name: 'חבילה' })).toBeInTheDocument();
  });

  it.each([
    'https://example.com/movie.mp4',
    'https://example.com/movie.WEBM?token=x',
    'https://example.com/movie.mov'
  ])('recognizes video media %s and can switch to artwork', (mediaUrl) => {
    render(<PackageMediaCarousel title="וידאו" mediaUrl={mediaUrl} art={<span>ART</span>} />);
    const video = screen.getByLabelText('סרטון וידאו');
    expect(video.tagName).toBe('VIDEO');
    expect(screen.getByText('סרטון')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'תמונה הבאה של וידאו' }));
    expect(screen.getByRole('img', { name: 'המחשת עיצוב וידאו' })).toBeInTheDocument();
    expect(screen.queryByText('סרטון')).not.toBeInTheDocument();
  });
});
