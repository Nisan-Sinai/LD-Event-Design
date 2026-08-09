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

  it('accepts a large mobile photo that will be resized before upload', () => {
    expect(validatePackageImage(image('large.jpg', 'image/jpeg', 8 * 1024 * 1024 + 1))).toBe('jpg');
  });

  it('accepts Android images with a missing or generic MIME type', () => {
    expect(validatePackageImage(image('camera.JPEG', ''))).toBe('jpg');
    expect(validatePackageImage(image('camera.jpeg', 'application/octet-stream'))).toBe('jpg');
  });

  it('rejects an empty image', () => {
    expect(() => validatePackageImage(image('empty.jpg', 'image/jpeg', 0))).toThrow(/empty/i);
  });

  it('rejects an image larger than 30 MB', () => {
    expect(() => validatePackageImage(image('huge.jpg', 'image/jpeg', 30 * 1024 * 1024 + 1))).toThrow(/30 MB/i);
  });

  it('rejects unsupported or spoofed file formats', () => {
    expect(() => validatePackageImage(image('vector.svg', 'image/svg+xml'))).toThrow(/unsupported/i);
    expect(() => validatePackageImage(image('script.jpg', 'text/javascript'))).toThrow(/unsupported/i);
  });
});
