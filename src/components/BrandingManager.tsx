import { useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, LoaderCircle, RotateCcw } from 'lucide-react';
import { createBrandingOverride, BRANDING_OVERRIDE_ID, brandLogoUrl } from '../lib/branding';
import { uploadPackageImage } from '../lib/packages';
import { usePackages } from '../packages/PackagesProvider';
import { useI18n } from '../i18n/i18n';

const COPY = {
  he: {
    title: 'הלוגו של LD Event Design',
    body: 'הלוגו יוצג באתר ויצורף לסיכום ההזמנה שנשלח ללקוח במייל.',
    upload: 'העלאת לוגו',
    uploading: 'מעלה לוגו…',
    saved: 'הלוגו נשמר',
    reset: 'הסרת הלוגו',
    error: 'לא הצלחנו לשמור את הלוגו. נסו קובץ JPG, PNG, WebP או AVIF עד 8MB.',
    preview: 'תצוגה מקדימה של הלוגו'
  },
  en: {
    title: 'LD Event Design logo',
    body: 'The logo appears on the website and in the order summary emailed to the customer.',
    upload: 'Upload logo',
    uploading: 'Uploading logo…',
    saved: 'Logo saved',
    reset: 'Remove logo',
    error: 'We could not save the logo. Try a JPG, PNG, WebP or AVIF file up to 8MB.',
    preview: 'Logo preview'
  }
} as const;

export function BrandingManager() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const { overrides, saveOverride, removeOverride } = usePackages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const logoUrl = brandLogoUrl(overrides);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setSaved(false);
    setError('');
    try {
      const url = await uploadPackageImage(file);
      await saveOverride(createBrandingOverride(url));
      setSaved(true);
    } catch {
      setError(copy.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const reset = async () => {
    setUploading(true);
    setSaved(false);
    setError('');
    try {
      await removeOverride(BRANDING_OVERRIDE_ID);
      setSaved(true);
    } catch {
      setError(copy.error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#E8C5B8]/70 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="branding-manager-title">
      <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-[#B8860B]" aria-hidden="true" />
            <h3 id="branding-manager-title" className="font-display text-xl font-black text-[#4D4037]">{copy.title}</h3>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">{copy.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <label className={'inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] px-5 py-3 text-xs font-extrabold text-white shadow-md ' + (uploading ? 'pointer-events-none opacity-60' : '')}>
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
              {uploading ? copy.uploading : copy.upload}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => void upload(event.target.files?.[0])}
              />
            </label>
            {logoUrl && (
              <button type="button" onClick={() => void reset()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-[#E8C5B8] px-5 py-3 text-xs font-extrabold text-[#7A5A46] hover:bg-[#FAF6F0] disabled:opacity-60">
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> {copy.reset}
              </button>
            )}
          </div>
          {saved && <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700" role="status"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{copy.saved}</p>}
          {error && <p className="mt-3 text-xs font-bold text-red-700" role="alert">{error}</p>}
        </div>
        <div className="flex min-h-32 items-center justify-center rounded-[1.5rem] border border-dashed border-[#D9C8B9] bg-[#FAF6F0] p-5">
          {logoUrl
            ? <img src={logoUrl} alt={copy.preview} className="max-h-24 max-w-full object-contain" />
            : <div className="text-center text-[#A29184]"><ImagePlus className="mx-auto h-8 w-8" aria-hidden="true" /><p className="mt-2 text-xs font-bold">{copy.preview}</p></div>}
        </div>
      </div>
    </section>
  );
}
