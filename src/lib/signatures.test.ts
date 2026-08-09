import { describe, expect, it } from 'vitest';
import { EMPTY_SIGNATURE, hasSignature, signatureKind } from './signatures';

describe('signatures', () => {
  it('classifies empty, typed and drawn signatures', () => {
    expect(hasSignature(EMPTY_SIGNATURE)).toBe(false);
    expect(signatureKind(EMPTY_SIGNATURE)).toBe('none');

    const typed = { ...EMPTY_SIGNATURE, typedName: '  ישראל ישראלי  ' };
    expect(hasSignature(typed)).toBe(true);
    expect(signatureKind(typed)).toBe('typed');

    const drawn = { ...typed, dataUrl: 'data:image/png;base64,ZmFrZQ==' };
    expect(hasSignature(drawn)).toBe(true);
    expect(signatureKind(drawn)).toBe('drawn');
  });
});
