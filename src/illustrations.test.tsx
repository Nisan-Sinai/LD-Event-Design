import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderPackageSVG, ArtDefsHost, PACKAGES } from './App';

// כל סוגי האיורים (כולל אליאס "event" וברירת מחדל לא מוכרת)
const types = [
  'chuppah-s', 'chuppah-m', 'chuppah-l', 'chuppah-drapes', 'gypsophila',
  'henna', 'henna-market', 'event-classic', 'event-balloon', 'event-vip',
  'event', 'bar', 'bar-branded', 'bar-boutique', 'unknown-type'
];

describe('renderPackageSVG', () => {
  it.each(types)('renders an illustration for "%s"', (t) => {
    const { container } = render(<div>{renderPackageSVG(t)}</div>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the shared defs host once', () => {
    const { container } = render(<ArtDefsHost />);
    expect(container.querySelector('defs')).toBeTruthy();
  });

  it('covers the svgType of every catalog package', () => {
    for (const p of PACKAGES) {
      const { container } = render(<div>{renderPackageSVG(p.svgType)}</div>);
      expect(container.firstChild).toBeTruthy();
    }
  });
});
