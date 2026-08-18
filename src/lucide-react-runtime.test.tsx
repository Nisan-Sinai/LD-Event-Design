import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Facebook, Instagram, X } from './lucide-react-runtime';

describe('lucide compatibility runtime', () => {
  it('re-exports Lucide icons and the local social icon compatibility wrappers', () => {
    render(
      <div>
        <Facebook aria-label="facebook" />
        <Instagram aria-label="instagram" />
        <X aria-label="close" />
      </div>
    );
    expect(screen.getByLabelText('facebook').tagName).toBe('svg');
    expect(screen.getByLabelText('instagram').tagName).toBe('svg');
    expect(screen.getByLabelText('close').tagName).toBe('svg');
  });
});
