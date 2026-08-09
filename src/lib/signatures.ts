export interface DigitalSignature {
  dataUrl: string;
  typedName: string;
  signedAt: string;
}

export const EMPTY_SIGNATURE: DigitalSignature = {
  dataUrl: '',
  typedName: '',
  signedAt: ''
};

export function hasSignature(signature: DigitalSignature): boolean {
  return Boolean(signature.dataUrl || signature.typedName.trim());
}

export function signatureKind(signature: DigitalSignature): 'drawn' | 'typed' | 'none' {
  if (signature.dataUrl) return 'drawn';
  if (signature.typedName.trim()) return 'typed';
  return 'none';
}
