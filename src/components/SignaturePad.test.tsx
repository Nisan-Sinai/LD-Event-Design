import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_SIGNATURE, type DigitalSignature } from '../lib/signatures';
import { renderWithProviders } from '../test/render';
import { SignaturePad } from './SignaturePad';

function Harness() {
  const [signature, setSignature] = useState<DigitalSignature>({ ...EMPTY_SIGNATURE });
  return (
    <>
      <SignaturePad
        id="test-signature"
        label="חתימת המזמין/ה"
        typedLabel="הקלדת שם מלא לחתימה"
        hint="אפשר לצייר או להקליד"
        value={signature}
        onChange={setSignature}
      />
      <output data-testid="signature-value">{JSON.stringify(signature)}</output>
    </>
  );
}

beforeEach(() => {
  window.localStorage.removeItem('ld-lang');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => vi.restoreAllMocks());

describe('SignaturePad', () => {
  it('accepts an accessible typed signature and can clear it', () => {
    renderWithProviders(<Harness />);

    fireEvent.change(screen.getByLabelText('הקלדת שם מלא לחתימה'), { target: { value: 'ישראל ישראלי' } });

    expect(screen.getByText(/החתימה נשמרה/)).toBeInTheDocument();
    expect(screen.getByTestId('signature-value')).toHaveTextContent('ישראל ישראלי');
    fireEvent.click(screen.getByRole('button', { name: 'ניקוי' }));
    expect(screen.getByText('טרם נחתם')).toBeInTheDocument();
    expect(screen.getByTestId('signature-value')).not.toHaveTextContent('ישראל ישראלי');
  });

  it('captures a drawn signature from pointer events', () => {
    const context = {
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn()
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,ZmFrZQ==');
    renderWithProviders(<Harness />);
    const canvas = screen.getByLabelText(/אזור ציור חתימה/);

    fireEvent.pointerMove(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 40, clientY: 30, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 40, clientY: 30, pointerId: 1 });

    expect(context.beginPath).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(screen.getByTestId('signature-value')).toHaveTextContent('data:image/png;base64,ZmFrZQ==');
  });
});
