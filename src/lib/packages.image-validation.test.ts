import { describe, expect, it } from 'vitest';
import { validatePackageImage } from './packages';

function image(name: string, type: string, size = 1): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validatePackageImage', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['image/avif', 'avif']
  ])('accepts %s and returns the safe extension', (type, extension) => {
    expect(validatePackageImage(image(`photo.${extension}`, type))).toBe(extension);
  });

  it('rejects an empty image', () => {
    expect(() => validatePackageImage(image('empty.jpg', 'image/jpeg', 0))).toThrow(/empty/i);
  });

  it('rejects an image larger than 8 MB', () => {
    expect(() => validatePackageImage(image('huge.jpg', 'image/jpeg', 8 * 1024 * 1024 + 1))).toThrow(/8 MB/i);
  });

  it('rejects unsupported or spoofed file formats', () => {
    expect(() => validatePackageImage(image('vector.svg', 'image/svg+xml'))).toThrow(/unsupported/i);
    expect(() => validatePackageImage(image('script.jpg', 'text/javascript'))).toThrow(/unsupported/i);
  });
});
