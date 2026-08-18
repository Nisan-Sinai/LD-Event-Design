import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  uploadedPath: null as string | null,
  uploadedBody: null as Blob | null,
  uploadedOptions: null as Record<string, unknown> | null
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    storage: {
      from: () => ({
        upload: (
          path: string,
          body: Blob,
          options: Record<string, unknown>
        ) => {
          state.uploadedPath = path;
          state.uploadedBody = body;
          state.uploadedOptions = options;
          return Promise.resolve({ error: null });
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.example/${path}` }
        })
      })
    }
  }
}));

import { uploadPackageImage, validatePackageImage } from './packages';

const largeJpeg = () =>
  new File([new Uint8Array(7 * 1024 * 1024)], 'large.jpg', {
    type: 'image/jpeg'
  });

const bitmap = (width = 1200, height = 800) => ({
  width,
  height,
  close: vi.fn()
});

beforeEach(() => {
  state.uploadedPath = null;
  state.uploadedBody = null;
  state.uploadedOptions = null;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('package image preparation edge cases', () => {
  it('keeps synchronous validation strict for generic MIME files without a known extension', () => {
    expect(() =>
      validatePackageImage(
        new File(['x'], 'camera', { type: 'application/octet-stream' })
      )
    ).toThrow(/unsupported image format/i);
  });

  it('detects a JPEG signature when Android omits MIME and filename extension', async () => {
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])],
      'camera',
      { type: 'application/octet-stream' }
    );

    const url = await uploadPackageImage(file);

    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(url).toBe(`https://cdn.example/${state.uploadedPath}`);
  });

  it('uploads the original image when decoded dimensions are invalid', async () => {
    const file = largeJpeg();
    const decoded = bitmap(0, 0);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));

    const url = await uploadPackageImage(file);

    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(url).toBe(`https://cdn.example/${state.uploadedPath}`);
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('uploads the original image when a canvas 2D context is unavailable', async () => {
    const file = largeJpeg();
    const decoded = bitmap();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await uploadPackageImage(file);

    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('uploads the original image when the browser cannot encode the canvas', async () => {
    const file = largeJpeg();
    const decoded = bitmap();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(null));

    await uploadPackageImage(file);

    expect(toBlob).toHaveBeenCalledTimes(2);
    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('retries WebP quality until the converted image fits the upload limit', async () => {
    const decoded = bitmap();
    const tooLarge = new Blob([new Uint8Array(6 * 1024 * 1024 + 1)], {
      type: 'image/webp'
    });
    const compressed = new Blob(['compressed'], { type: 'image/webp' });
    const encoded = [tooLarge, compressed];

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(encoded.shift() ?? compressed));

    const url = await uploadPackageImage(largeJpeg());

    expect(toBlob).toHaveBeenCalledTimes(2);
    expect(state.uploadedBody).toBe(compressed);
    expect(state.uploadedPath).toMatch(/\.webp$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/webp' });
    expect(url).toBe(`https://cdn.example/${state.uploadedPath}`);
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('uploads the original image when conversion cannot get below the preferred size', async () => {
    const file = largeJpeg();
    const decoded = bitmap();
    const tooLarge = new Blob([new Uint8Array(6 * 1024 * 1024 + 1)], {
      type: 'image/webp'
    });

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(tooLarge));

    await uploadPackageImage(file);

    expect(toBlob.mock.calls.length).toBeGreaterThan(1);
    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.jpg$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/jpeg' });
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('supports HEIC conversion and falls back to WebP when the encoded MIME is missing', async () => {
    const decoded = bitmap();
    const converted = new Blob(['converted']);

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback) => callback(converted)
    );

    await uploadPackageImage(
      new File(['heic'], 'photo.heic', { type: 'image/heic' })
    );

    expect(state.uploadedPath).toMatch(/\.webp$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/webp' });
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('uploads the original HEIC when browser conversion cannot decode valid dimensions', async () => {
    const file = new File(['heic'], 'photo.heic', { type: 'image/heic' });
    const decoded = bitmap(0, 0);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));

    await uploadPackageImage(file);

    expect(state.uploadedBody).toBe(file);
    expect(state.uploadedPath).toMatch(/\.heic$/);
    expect(state.uploadedOptions).toMatchObject({ contentType: 'image/heic' });
    expect(decoded.close).toHaveBeenCalledOnce();
  });
});