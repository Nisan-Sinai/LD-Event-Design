export const MIN_PASSWORD_LENGTH = 12;

export function isStrongEnoughPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

/** Reuses the existing localized short-password copy while keeping the number accurate. */
export function passwordLengthMessage(localizedMessage: string): string {
  return localizedMessage.replace(/\d+/, String(MIN_PASSWORD_LENGTH));
}
