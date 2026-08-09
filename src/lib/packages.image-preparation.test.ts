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
  it('rejects generic MIME files when the filename has no supported extension', () => {
    expect(() =>
      validatePackageImage(
        new File(['x'], 'camera', { type: 'application/octet-stream' })
      )
    ).toThrow(/unsupported image format/i);
  });

  it('explains when the browser cannot resize a large image', async () => {
    vi.stubGlobal('createImageBitmap', undefined);

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(
      /cannot resize/i
    );
    expect(state.uploadedPath).toBeNull();
  });

  it('rejects decoded images with invalid dimensions and closes the bitmap', async () => {
    const decoded = bitmap(0, 0);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(
      /dimensions are invalid/i
    );
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('rejects conversion when a canvas 2D context is unavailable', async () => {
    const decoded = bitmap();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(
      /conversion is unavailable/i
    );
    expect(decoded.close).toHaveBeenCalledOnce();
  });

  it('rejects conversion when the browser cannot encode the canvas', async () => {
    const decoded = bitmap();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(decoded));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback) => callback(null)
    );

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(
      /conversion failed/i
    );
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

  it('rejects an image that remains too large after all quality retries', async () => {
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

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(
      /still too large/i
    );
    expect(toBlob.mock.calls.length).toBeGreaterThan(1);
    expect(state.uploadedPath).toBeNull();
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

  it('closes no bitmap when decoding itself fails', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockRejectedValue(new Error('decode failed'))
    );

    await expect(uploadPackageImage(largeJpeg())).rejects.toThrow(/decode failed/i);
    expect(state.uploadedPath).toBeNull();
  });
});
