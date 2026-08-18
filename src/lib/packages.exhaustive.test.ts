import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  configured: true,
  uploadedPath: null as string | null,
  uploadedBody: null as Blob | null,
  uploadedOptions: null as Record<string, unknown> | null,
  uploadError: null as unknown
}));

vi.mock('./supabase', () => ({
  get isSupabaseConfigured() {
    return state.configured;
  },
  supabase: {
    storage: {
      from: () => ({
        upload: async (path: string, body: Blob, options: Record<string, unknown>) => {
          state.uploadedPath = path;
          state.uploadedBody = body;
          state.uploadedOptions = options;
          return { error: state.uploadError };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } })
      })
    }
  }
}));

import { uploadPackageImage, validatePackageImage } from './packages';

const generic = (bytes: number[], name = 'camera') =>
  new File([new Uint8Array(bytes)], name, { type: 'application/octet-stream' });

const padded = (prefix: number[], size = 32) => {
  const bytes = Array<number>(size).fill(0);
  prefix.forEach((value, index) => { bytes[index] = value; });
  return bytes;
};

const asciiAt = (text: string, offset: number, size = 32) => {
  const bytes = Array<number>(size).fill(0);
  [...text].forEach((char, index) => { bytes[offset + index] = char.charCodeAt(0); });
  return bytes;
};

const largeJpeg = () => new File([new Uint8Array(7 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

function makeBrowserRejectImageDecode() {
  vi.stubGlobal('createImageBitmap', undefined);
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:unsupported') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  class UnsupportedImage {
    decoding = '';
    src = '';
    naturalWidth = 0;
    naturalHeight = 0;
    decode = vi.fn().mockRejectedValue(new Error('unsupported image format'));
  }
  vi.stubGlobal('Image', UnsupportedImage);
}

beforeEach(() => {
  state.configured = true;
  state.uploadedPath = null;
  state.uploadedBody = null;
  state.uploadedOptions = null;
  state.uploadError = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('package image signature detection', () => {
  it.each([
    ['png', 'image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['gif', 'image/gif', [...'GIF89a'].map((c) => c.charCodeAt(0))],
    ['bmp', 'image/bmp', [0x42, 0x4d, 0, 0]],
    ['tiff', 'image/tiff', [0x49, 0x49, 0x2a, 0x00]],
    ['tiff', 'image/tiff', [0x4d, 0x4d, 0x00, 0x2a]],
    ['ico', 'image/x-icon', [0x00, 0x00, 0x01, 0x00]],
    ['jxl', 'image/jxl', [0xff, 0x0a, 0x00, 0x00]]
  ])('detects %s from bytes without useful metadata', async (extension, contentType, prefix) => {
    const file = generic(padded(prefix));
    await uploadPackageImage(file);
    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(new RegExp(`\\.${extension}$`));
    expect(state.uploadedOptions).toMatchObject({ contentType });
  });

  it('detects WebP from the RIFF/WEBP container signature', async () => {
    const bytes = asciiAt('RIFF', 0);
    [...'WEBP'].forEach((char, index) => { bytes[8 + index] = char.charCodeAt(0); });
    await uploadPackageImage(generic(bytes));
    expect(state.uploadedPath).toMatch(/\.webp$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/webp' });
  });

  it('detects boxed JPEG XL', async () => {
    const bytes = padded([0x00, 0x00, 0x00, 0x0c]);
    [...'JXL '].forEach((char, index) => { bytes[4 + index] = char.charCodeAt(0); });
    await uploadPackageImage(generic(bytes));
    expect(state.uploadedPath).toMatch(/\.jxl$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jxl' });
  });

  it.each([
    ['avif', 'avif', 'image/avif'],
    ['avis', 'avif', 'image/avif'],
    ['heic', 'heic', 'image/heic'],
    ['heix', 'heic', 'image/heic'],
    ['hevc', 'heic', 'image/heic'],
    ['hevx', 'heic', 'image/heic'],
    ['heim', 'heic', 'image/heic'],
    ['heis', 'heic', 'image/heic'],
    ['mif1', 'heif', 'image/heif'],
    ['msf1', 'heif', 'image/heif']
  ])('detects ISO-BMFF brand %s as %s', async (brand, extension, contentType) => {
    const bytes = Array<number>(32).fill(0);
    [...'ftyp'].forEach((char, index) => { bytes[4 + index] = char.charCodeAt(0); });
    [...brand].forEach((char, index) => { bytes[8 + index] = char.charCodeAt(0); });
    if (extension === 'heic' || extension === 'heif') makeBrowserRejectImageDecode();
    const file = generic(bytes);
    await uploadPackageImage(file);
    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(new RegExp(`\\.${extension}$`));
    expect(state.uploadedOptions).toMatchObject({ contentType });
  });

  it('falls back to filename validation for unknown and short signatures', async () => {
    await uploadPackageImage(generic([1, 2, 3], 'photo.png'));
    expect(state.uploadedPath).toMatch(/\.png$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/png' });

    await uploadPackageImage(generic(Array(32).fill(7), 'photo.webp'));
    expect(state.uploadedPath).toMatch(/\.webp$/);
  });

  it('rejects unknown generic files when neither signature nor filename identifies an image', async () => {
    await expect(uploadPackageImage(generic(Array(32).fill(7), 'camera'))).rejects.toThrow(/unsupported/i);
  });
});

describe('package image conversion browser fallbacks', () => {
  it('scales very large dimensions down to the 2400px limit and cleans up the bitmap', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4800, height: 2400, close }));
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['ok'], { type: 'image/webp' })));

    await uploadPackageImage(largeJpeg());

    expect(drawImage).toHaveBeenCalled();
    const [, , , width, height] = drawImage.mock.calls[0];
    expect(width).toBe(2400);
    expect(height).toBe(1200);
    expect(close).toHaveBeenCalledOnce();
    expect(state.uploadedPath).toMatch(/\.webp$/);
  });

  it('falls back from failed WebP encoding to successful JPEG encoding', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1000, height: 800, close }));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const jpeg = new Blob(['jpeg'], { type: 'image/jpeg' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementationOnce((callback) => callback(null))
      .mockImplementationOnce((callback) => callback(jpeg));

    await uploadPackageImage(largeJpeg());
    expect(toBlob).toHaveBeenCalledTimes(2);
    expect(state.uploadedBody).toBe(jpeg);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(close).toHaveBeenCalledOnce();
  });

  it('falls back to an HTMLImageElement when createImageBitmap rejects and revokes the object URL after success', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bitmap decode failed')));
    const createObjectURL = vi.fn(() => 'blob:qa');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    class FakeImage {
      decoding = '';
      src = '';
      naturalWidth = 1600;
      naturalHeight = 900;
      decode = vi.fn().mockResolvedValue(undefined);
    }
    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['ok'], { type: 'image/webp' })));

    await uploadPackageImage(largeJpeg());
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:qa');
    expect(state.uploadedPath).toMatch(/\.webp$/);
  });

  it('supports browsers without image.decode by waiting for onload', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:onload') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    class OnloadImage {
      decoding = '';
      naturalWidth = 1200;
      naturalHeight = 800;
      decode = undefined;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', OnloadImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['ok'], { type: 'image/webp' })));

    await uploadPackageImage(largeJpeg());
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:onload');
    expect(state.uploadedPath).toMatch(/\.webp$/);
  });

  it('revokes an object URL and uploads the original when HTML image decoding fails', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:error') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    class ErrorImage {
      decoding = '';
      naturalWidth = 1200;
      naturalHeight = 800;
      decode = undefined;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Image', ErrorImage);

    const file = largeJpeg();
    await uploadPackageImage(file);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:error');
    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
  });
});

describe('validation metadata edge cases', () => {
  it('accepts legacy and vendor image MIME aliases', () => {
    expect(validatePackageImage(new File(['x'], 'a.jpg', { type: 'image/pjpeg' }))).toBe('jpg');
    expect(validatePackageImage(new File(['x'], 'a.bmp', { type: 'image/x-ms-bmp' }))).toBe('bmp');
    expect(validatePackageImage(new File(['x'], 'a.tif', { type: 'image/x-tiff' }))).toBe('tiff');
    expect(validatePackageImage(new File(['x'], 'a.ico', { type: 'image/vnd.microsoft.icon' }))).toBe('ico');
    expect(validatePackageImage(new File(['x'], 'a.ico', { type: 'image/x-icon' }))).toBe('ico');
    expect(validatePackageImage(new File(['x'], 'a.heics', { type: 'image/heic-sequence' }))).toBe('heic');
    expect(validatePackageImage(new File(['x'], 'a.heifs', { type: 'image/heif-sequence' }))).toBe('heif');
  });

  it('normalizes unknown image MIME subtypes when no safe extension is present', () => {
    expect(validatePackageImage(new File(['x'], 'camera.', { type: 'image/x-canon-cr3' }))).toBe('canoncr3');
    expect(validatePackageImage(new File(['x'], 'camera.', { type: 'image/foo+json; charset=utf-8' }))).toBe('foo');
  });

  it('rejects malformed/blocked unknown image subtypes', () => {
    expect(() => validatePackageImage(new File(['x'], 'camera.', { type: 'image/svg-custom' }))).toThrow(/unsupported/i);
    expect(() => validatePackageImage(new File(['x'], 'camera.', { type: 'image/xml-custom' }))).toThrow(/unsupported/i);
    expect(() => validatePackageImage(new File(['x'], 'camera.', { type: 'image/!!!!!!!!' }))).toThrow(/unsupported/i);
  });
});
