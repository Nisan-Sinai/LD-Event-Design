import { useRef, type PointerEvent } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { EMPTY_SIGNATURE, hasSignature, type DigitalSignature } from '../lib/signatures';
import { useI18n } from '../i18n/i18n';

interface SignaturePadProps {
  id: string;
  label: string;
  typedLabel: string;
  hint: string;
  value: DigitalSignature;
  onChange: (value: DigitalSignature) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SignaturePad({ id, label, typedLabel, hint, value, onChange }: SignaturePadProps) {
  const { lang } = useI18n();
  const copy = lang === 'he'
    ? { canvas: 'אזור ציור חתימה', draw: 'חתמו כאן באצבע או בעכבר', or: 'או', saved: 'החתימה נשמרה', empty: 'טרם נחתם', clear: 'ניקוי' }
    : { canvas: 'signature drawing area', draw: 'Sign here with a finger or mouse', or: 'or', saved: 'Signature saved', empty: 'Not signed yet', clear: 'Clear' };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / Math.max(rect.width, 1)),
      y: (event.clientY - rect.top) * (canvas.height / Math.max(rect.height, 1))
    };
  };

  const context = (canvas: HTMLCanvasElement) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.strokeStyle = '#2C2C2C';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      return ctx;
    } catch {
      return null;
    }
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const ctx = context(event.currentTarget);
    if (!ctx) return;
    const current = point(event);
    drawingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(current.x, current.y);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = context(event.currentTarget);
    if (!ctx) return;
    const current = point(event);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    let dataUrl = '';
    try {
      dataUrl = event.currentTarget.toDataURL('image/png');
    } catch {
      // The typed-name field remains a fully accessible signing alternative.
    }
    if (dataUrl) onChange({ ...value, dataUrl, signedAt: value.signedAt || today() });
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) context(canvas)?.clearRect(0, 0, canvas.width, canvas.height);
    onChange({ ...EMPTY_SIGNATURE });
  };

  const signed = hasSignature(value);

  return (
    <fieldset className="rounded-[1.5rem] border border-[#E8C5B8]/80 bg-[#FAF6F0] p-4">
      <legend className="px-2 text-sm font-extrabold text-[#2C2C2C]">{label}</legend>
      <p className="mb-3 text-xs leading-relaxed text-[#756B64]">{hint}</p>
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#B8860B]/55 bg-white">
        <canvas
          ref={canvasRef}
          id={id}
          width={700}
          height={180}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
          aria-label={`${label} — ${copy.canvas}`}
          className="h-28 w-full touch-none cursor-crosshair"
        />
        {!value.dataUrl && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-xs text-[#A5968A]">
            <PenLine className="h-4 w-4" aria-hidden="true" /> {copy.draw}
          </span>
        )}
      </div>
      <div className="my-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A8D84]">
        <span className="h-px flex-1 bg-[#E8C5B8]" aria-hidden="true" /> {copy.or} <span className="h-px flex-1 bg-[#E8C5B8]" aria-hidden="true" />
      </div>
      <label htmlFor={`${id}-typed`} className="block text-xs font-extrabold text-[#2C2C2C]">
        {typedLabel}
        <input
          id={`${id}-typed`}
          value={value.typedName}
          onChange={(event) => onChange({ ...value, typedName: event.target.value, signedAt: event.target.value.trim() ? value.signedAt || today() : value.signedAt })}
          autoComplete="name"
          className="mt-2 w-full rounded-2xl border border-[#E8C5B8] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#B8860B] focus:ring-4 focus:ring-[#E8C5B8]/30"
        />
      </label>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-xs font-bold ${signed ? 'text-emerald-700' : 'text-[#8A7F77]'}`} aria-live="polite">
          {signed ? `${copy.saved} · ${value.signedAt}` : copy.empty}
        </span>
        {signed && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
            <Eraser className="h-3.5 w-3.5" aria-hidden="true" /> {copy.clear}
          </button>
        )}
      </div>
    </fieldset>
  );
}
