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
    ['image/avif', 'avif'],
    ['image/heic', 'heic'],
    ['image/heif', 'heif'],
    ['image/gif', 'gif'],
    ['image/bmp', 'bmp'],
    ['image/tiff', 'tiff'],
    ['image/jxl', 'jxl']
  ])('accepts %s and returns the safe extension', (type, extension) => {
    expect(validatePackageImage(image(`photo.${extension}`, type))).toBe(extension);
  });

  it('accepts a large mobile photo that will be resized before upload', () => {
    expect(validatePackageImage(image('large.jpg', 'image/jpeg', 8 * 1024 * 1024 + 1))).toBe('jpg');
  });

  it('accepts mobile photos up to 50 MB', () => {
    expect(validatePackageImage(image('large.jpg', 'image/jpeg', 49 * 1024 * 1024))).toBe('jpg');
  });

  it('accepts Android images with a missing or generic MIME type', () => {
    expect(validatePackageImage(image('camera.JPEG', ''))).toBe('jpg');
    expect(validatePackageImage(image('camera.jpeg', 'application/octet-stream'))).toBe('jpg');
    expect(validatePackageImage(image('camera.HEIC', 'application/octet-stream'))).toBe('heic');
  });

  it('accepts image MIME types that are not hard-coded when the file extension is safe', () => {
    expect(validatePackageImage(image('camera.cr3', 'image/x-canon-cr3'))).toBe('cr3');
  });

  it('rejects an empty image', () => {
    expect(() => validatePackageImage(image('empty.jpg', 'image/jpeg', 0))).toThrow(/empty/i);
  });

  it('rejects an image larger than 50 MB', () => {
    expect(() => validatePackageImage(image('huge.jpg', 'image/jpeg', 50 * 1024 * 1024 + 1))).toThrow(/50 MB/i);
  });

  it('rejects active SVG/XML image formats', () => {
    expect(() => validatePackageImage(image('vector.svg', 'image/svg+xml'))).toThrow(/security/i);
    expect(() => validatePackageImage(image('vector.xml', 'application/xml'))).toThrow(/security|unsupported/i);
  });

  it('rejects unsupported non-image content', () => {
    expect(() => validatePackageImage(image('script.jpg', 'text/javascript'))).toThrow(/unsupported/i);
    expect(() => validatePackageImage(image('unknown.bin', 'application/octet-stream'))).toThrow(/unsupported/i);
  });
});
