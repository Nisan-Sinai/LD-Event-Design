import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useI18n } from './i18n';

function Probe() {
  const { t, tList, lang, dir, setLang, toggleLang } = useI18n();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="home">{t('nav.home')}</span>
      <span data-testid="vars">{t('footer.rights', { year: 2026 })}</span>
      <span data-testid="missing">{t('no.such.key')}</span>
      <span data-testid="deep">{t('meta.title.deeper')}</span>
      <span data-testid="list-len">{tList('home.marquee').length}</span>
      <span data-testid="list-not-array">{tList('meta.title').length}</span>
      <span data-testid="list-missing">{tList('no.such.list').length}</span>
      <button onClick={() => setLang('en')}>to-en</button>
      <button onClick={() => setLang('he')}>to-he</button>
      <button onClick={() => toggleLang()}>toggle</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>
  );

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.lang = '';
  document.documentElement.dir = '';
});

describe('I18nProvider', () => {
  it('defaults to Hebrew with RTL and applies lang/dir/title to the document', () => {
    renderProbe();
    expect(screen.getByTestId('lang').textContent).toBe('he');
    expect(screen.getByTestId('dir').textContent).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.title).toContain('LD Event Design');
    expect(screen.getByTestId('home').textContent).toBe('בית');
  });

  it('replaces {vars} in translations', () => {
    renderProbe();
    expect(screen.getByTestId('vars').textContent).toContain('2026');
  });

  it('returns the key itself for a missing translation', () => {
    renderProbe();
    expect(screen.getByTestId('missing').textContent).toBe('no.such.key');
  });

  it('returns the key when the path walks through a non-object value', () => {
    renderProbe();
    expect(screen.getByTestId('deep').textContent).toBe('meta.title.deeper');
  });

  it('tList returns arrays for array keys and [] otherwise', () => {
    renderProbe();
    expect(Number(screen.getByTestId('list-len').textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId('list-not-array').textContent).toBe('0');
    expect(screen.getByTestId('list-missing').textContent).toBe('0');
  });

  it('switches to English: LTR, persisted, meta description updated', () => {
    renderProbe();
    fireEvent.click(screen.getByText('to-en'));
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('dir').textContent).toBe('ltr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(window.localStorage.getItem('ld-lang')).toBe('en');
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute('content')).toMatch(/event design studio/i);
    expect(screen.getByTestId('home').textContent).toBe('Home');
    // חזרה לעברית מעדכנת את אותו תג meta (ענף "כבר קיים")
    fireEvent.click(screen.getByText('to-he'));
    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
  });

  it('toggleLang flips the language back and forth', () => {
    renderProbe();
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('lang').textContent).toBe('en');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('lang').textContent).toBe('he');
  });

  it('restores a saved language from localStorage', () => {
    window.localStorage.setItem('ld-lang', 'en');
    renderProbe();
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('ignores an invalid saved value', () => {
    window.localStorage.setItem('ld-lang', 'xx');
    renderProbe();
    expect(screen.getByTestId('lang').textContent).toBe('he');
  });

  it('survives a localStorage that throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderProbe();
    expect(screen.getByTestId('lang').textContent).toBe('he');
  });

  it('survives a localStorage that throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderProbe();
    fireEvent.click(screen.getByText('to-en'));
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('useI18n outside the provider throws a clear error', () => {
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/I18nProvider/);
    silence.mockRestore();
  });
});
