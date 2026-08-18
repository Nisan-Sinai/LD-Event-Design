import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { inferPackageMediaUrls, PackageMediaCarousel } from './PackageMediaCarousel';
import type { PackageOverride } from '../lib/packages';

const override = (input: Partial<PackageOverride> & { package_id: string }): PackageOverride => ({
  price: null,
  title: null,
  subtitle: null,
  description: null,
  benefits: null,
  image_url: null,
  image_url_2: null,
  image_url_3: null,
  image_url_4: null,
  category: null,
  svg_type: null,
  pricing_tiers: null,
  hidden: false,
  is_custom: false,
  sort_order: null,
  ...input,
  package_id: input.package_id
});

describe('inferPackageMediaUrls', () => {
  it('returns all four slots for the package whose visible image matches', () => {
    const urls = inferPackageMediaUrls('https://example.com/two.jpg', {
      other: override({ package_id: 'other', image_url: 'https://example.com/other.jpg' }),
      pkg: override({
        package_id: 'pkg',
        image_url: 'https://example.com/one.jpg',
        image_url_2: 'https://example.com/two.jpg',
        image_url_3: 'https://example.com/three.jpg',
        image_url_4: 'https://example.com/four.jpg'
      })
    });
    expect(urls).toEqual([
      'https://example.com/one.jpg',
      'https://example.com/two.jpg',
      'https://example.com/three.jpg',
      'https://example.com/four.jpg'
    ]);
  });

  it('still resolves the gallery when image slot 1 is empty', () => {
    expect(inferPackageMediaUrls('https://example.com/two.jpg', {
      pkg: override({
        package_id: 'pkg',
        image_url: null,
        image_url_2: 'https://example.com/two.jpg',
        image_url_3: 'https://example.com/three.jpg',
        image_url_4: 'https://example.com/four.jpg'
      })
    })).toEqual([
      'https://example.com/two.jpg',
      'https://example.com/three.jpg',
      'https://example.com/four.jpg'
    ]);
  });

  it('deduplicates/ignores blanks and returns empty when no package matches', () => {
    const overrides = {
      pkg: override({
        package_id: 'pkg',
        image_url: ' https://example.com/one.jpg ',
        image_url_2: '',
        image_url_3: 'https://example.com/one.jpg',
        image_url_4: null
      })
    };
    expect(inferPackageMediaUrls('https://example.com/one.jpg', overrides)).toEqual(['https://example.com/one.jpg']);
    expect(inferPackageMediaUrls('https://example.com/missing.jpg', overrides)).toEqual([]);
    expect(inferPackageMediaUrls(undefined, overrides)).toEqual([]);
  });
});

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

  it('shows four uploaded package images plus the artwork fallback', () => {
    render(
      <PackageMediaCarousel
        title="ארבע תמונות"
        mediaUrls={[
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg'
        ]}
        art={<span>ART</span>}
      />
    );

    expect(screen.getAllByRole('button', { name: /מעבר למדיה/ })).toHaveLength(5);
    expect(screen.getByRole('img', { name: 'ארבע תמונות — תמונה 1' })).toHaveAttribute('src', 'https://example.com/1.jpg');
    fireEvent.click(screen.getByRole('button', { name: 'מעבר למדיה 4 של ארבע תמונות' }));
    expect(screen.getByRole('img', { name: 'ארבע תמונות — תמונה 4' })).toHaveAttribute('src', 'https://example.com/4.jpg');
    fireEvent.click(screen.getByRole('button', { name: 'מעבר למדיה 5 של ארבע תמונות' }));
    expect(screen.getByRole('img', { name: 'המחשת עיצוב ארבע תמונות' })).toHaveTextContent('ART');
  });

  it('deduplicates explicit media and limits uploaded media to four', () => {
    render(
      <PackageMediaCarousel
        title="מוגבל"
        mediaUrl="https://example.com/1.jpg"
        mediaUrls={[
          ' https://example.com/1.jpg ',
          '',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg'
        ]}
        art={<span>ART</span>}
      />
    );
    expect(screen.getAllByRole('button', { name: /מעבר למדיה/ })).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'מעבר למדיה 6 של מוגבל' })).not.toBeInTheDocument();
  });

  it.each([
    'https://example.com/movie.mp4',
    'https://example.com/movie.WEBM?token=x',
    'https://example.com/movie.mov'
  ])('recognizes video media %s and can switch to artwork', (mediaUrl) => {
    render(<PackageMediaCarousel title="וידאו" mediaUrl={mediaUrl} art={<span>ART</span>} />);
    const video = screen.getByLabelText('סרטון וידאו 1');
    expect(video.tagName).toBe('VIDEO');
    expect(screen.getByText('סרטון')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'תמונה הבאה של וידאו' }));
    expect(screen.getByRole('img', { name: 'המחשת עיצוב וידאו' })).toBeInTheDocument();
    expect(screen.queryByText('סרטון')).not.toBeInTheDocument();
  });
});
