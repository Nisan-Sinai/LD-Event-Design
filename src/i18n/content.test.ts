import { describe, it, expect } from 'vitest';
import { categoryLabel, localizedAddonName, localizedUnit, PACKAGE_EN, ADDON_EN } from './content';

describe('categoryLabel', () => {
  it('returns Hebrew label for he', () => {
    expect(categoryLabel('חתונה', 'he')).toBe('חתונה');
  });
  it('returns English label for en', () => {
    expect(categoryLabel('חתונה', 'en')).toBe('Wedding');
    expect(categoryLabel('עמדות בר מתוק', 'en')).toBe('Sweet Bars');
  });
  it('falls back to the id for an unknown category', () => {
    expect(categoryLabel('unknown', 'en')).toBe('unknown');
  });
});

describe('localizedAddonName', () => {
  it('returns the Hebrew fallback in he mode', () => {
    expect(localizedAddonName('bar-name-sign', 'שלט קפה עם שם הילד/ה', 'he')).toBe('שלט קפה עם שם הילד/ה');
  });
  it('returns the English translation in en mode', () => {
    expect(localizedAddonName('bar-name-sign', 'שלט קפה עם שם הילד/ה', 'en')).toBe(ADDON_EN['bar-name-sign']);
  });
  it('falls back to Hebrew when no English exists', () => {
    expect(localizedAddonName('nope', 'עברית', 'en')).toBe('עברית');
  });
});

describe('localizedUnit', () => {
  it('translates the per-meter unit to English', () => {
    expect(localizedUnit('למטר', 'en')).toBe('per meter');
  });
  it('keeps Hebrew in he mode', () => {
    expect(localizedUnit('למטר', 'he')).toBe('למטר');
  });
  it('returns undefined when there is no unit', () => {
    expect(localizedUnit(undefined, 'en')).toBeUndefined();
  });
});

describe('PACKAGE_EN coverage', () => {
  const ids = [
    'classic-s', 'classic-m', 'classic-l', 'gypsophila', 'chuppah-drapes',
    'henna-cookies', 'henna-market', 'event-classic', 'event-balloon', 'event-vip',
    'bar-candy', 'bar-branded', 'bar-boutique'
  ];
  it('has an English translation for every package id', () => {
    for (const id of ids) {
      expect(PACKAGE_EN[id], `missing EN for ${id}`).toBeDefined();
      expect(PACKAGE_EN[id].title.length).toBeGreaterThan(0);
      expect(PACKAGE_EN[id].description.length).toBeGreaterThan(0);
    }
  });
});
