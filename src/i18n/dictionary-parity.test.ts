import { describe, expect, it } from 'vitest';
import he from './he.json';
import en from './en.json';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function leafPaths(value: JsonValue, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafPaths(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function stringEntries(value: JsonValue, prefix = ''): Array<[string, string]> {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => stringEntries(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => stringEntries(child, prefix ? `${prefix}.${key}` : key));
  }
  return typeof value === 'string' ? [[prefix, value]] : [];
}

describe('translation dictionaries', () => {
  it('keeps Hebrew and English dictionary paths in sync', () => {
    expect(leafPaths(en as JsonValue).sort()).toEqual(leafPaths(he as JsonValue).sort());
  });

  it('does not leave Hebrew copy inside the English dictionary', () => {
    const allowedHebrewPaths = new Set(['lang.he']);
    const untranslated = stringEntries(en as JsonValue)
      .filter(([path, text]) => !allowedHebrewPaths.has(path) && /[\u0590-\u05FF]/.test(text))
      .map(([path]) => path);

    expect(untranslated).toEqual([]);
  });
});
