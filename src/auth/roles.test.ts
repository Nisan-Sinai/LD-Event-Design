import { describe, it, expect } from 'vitest';
import { DEFAULT_ADMIN_EMAILS, parseAdminEmails, roleForEmail } from './roles';

describe('parseAdminEmails', () => {
  it('uses both permanent administrator emails when env is undefined', () => {
    expect(parseAdminEmails(undefined)).toEqual([
      'luroni704@gmail.com',
      'nisan.sinai5@gmail.com'
    ]);
    expect(DEFAULT_ADMIN_EMAILS).toContain('nisan.sinai5@gmail.com');
  });

  it('parses a comma-separated list with spaces and mixed case', () => {
    expect(parseAdminEmails(' A@b.com , c@D.com ')).toEqual(['a@b.com', 'c@d.com']);
  });

  it('filters out empty entries', () => {
    expect(parseAdminEmails('a@b.com,,  ,c@d.com')).toEqual(['a@b.com', 'c@d.com']);
  });

  it('respects a custom fallback', () => {
    expect(parseAdminEmails(undefined, 'x@y.com')).toEqual(['x@y.com']);
  });
});

describe('roleForEmail', () => {
  const admins = ['luroni704@gmail.com', 'nisan.sinai5@gmail.com'];

  it('returns guest for null/undefined/empty email', () => {
    expect(roleForEmail(null, admins)).toBe('guest');
    expect(roleForEmail(undefined, admins)).toBe('guest');
    expect(roleForEmail('', admins)).toBe('guest');
  });

  it('returns admin for either permanent admin email, case-insensitively', () => {
    expect(roleForEmail('luroni704@gmail.com', admins)).toBe('admin');
    expect(roleForEmail('LURONI704@GMAIL.COM', admins)).toBe('admin');
    expect(roleForEmail('nisan.sinai5@gmail.com', admins)).toBe('admin');
    expect(roleForEmail('NISAN.SINAI5@GMAIL.COM', admins)).toBe('admin');
  });

  it('returns customer for any other email', () => {
    expect(roleForEmail('someone@else.com', admins)).toBe('customer');
  });

  it('cannot self-promote: customer stays customer when admin list is empty', () => {
    expect(roleForEmail('nisan.sinai5@gmail.com', [])).toBe('customer');
  });
});
