import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  submit: vi.fn(async () => ({ id: 'lead-1' }))
}));

vi.mock('../lib/submitLead', () => ({ submitLead: state.submit }));

import { LeadCaptureModal } from './LeadCaptureModal';

function showByTimer() {
  act(() => {
    vi.advanceTimersByTime(14_000);
  });
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('שם מלא'), { target: { value: 'ניסן סיני' } });
  fireEvent.change(screen.getByLabelText('טלפון'), { target: { value: '054-1234567' } });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  state.submit.mockReset().mockResolvedValue({ id: 'lead-1' });
  document.body.style.overflow = '';
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 });
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  document.body.style.overflow = '';
});

describe('LeadCaptureModal', () => {
  it('does not schedule or show after this session was already dismissed', () => {
    window.sessionStorage.setItem('ld-event-design-lead-popup-dismissed', '1');
    render(<LeadCaptureModal />);
    showByTimer();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens after 14 seconds, locks scroll, focuses the dialog and renders the intended field styling', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<LeadCaptureModal />);
    showByTimer();

    const dialog = screen.getByRole('dialog');
    act(() => vi.advanceTimersByTime(0));
    expect(document.activeElement).toBe(dialog);
    expect(document.body.style.overflow).toBe('hidden');

    const phone = screen.getByLabelText('טלפון');
    expect(phone).toHaveAttribute('dir', 'ltr');
    expect(phone).toHaveClass('lead-phone-input', 'pr-11', 'pl-4', 'text-right');
    expect(phone).not.toHaveClass('ps-11', 'pe-4');
    expect(screen.getByLabelText('תאריך האירוע')).toHaveAttribute('type', 'date');
    expect(screen.getByText('תאריך האירוע')).toBeVisible();

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('opens only after enough scroll and only on a real top-edge exit', () => {
    const { unmount } = render(<LeadCaptureModal />);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 400 });
    fireEvent.scroll(window);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 700 });
    fireEvent.scroll(window);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    unmount();

    window.sessionStorage.clear();
    render(<LeadCaptureModal />);
    fireEvent.mouseLeave(document, { clientY: 50 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.mouseLeave(document, { clientY: 8 });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not reopen or duplicate the modal after it has already been shown once', () => {
    render(<LeadCaptureModal />);
    showByTimer();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    fireEvent.scroll(window);
    fireEvent.mouseLeave(document, { clientY: 0 });
    act(() => vi.advanceTimersByTime(14_000));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('closes from Escape, close button and backdrop, but not from dialog mouse down', () => {
    render(<LeadCaptureModal />);
    showByTimer();
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(dialog).toBeInTheDocument();
    fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('ld-event-design-lead-popup-dismissed')).toBe('1');

    window.sessionStorage.clear();
    const { unmount } = render(<LeadCaptureModal />);
    showByTimer();
    fireEvent.click(screen.getByRole('button', { name: 'סגירת חלון הייעוץ' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    window.sessionStorage.clear();
    const rendered = render(<LeadCaptureModal />);
    showByTimer();
    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.mouseDown(backdrop);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rendered.unmount();
  });

  it('validates full name/phone and clears the error when a field changes', () => {
    render(<LeadCaptureModal />);
    showByTimer();
    fireEvent.submit(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('נא למלא שם מלא ומספר טלפון תקין.');
    expect(state.submit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('שם מלא'), { target: { value: 'ניסן' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('טלפון'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('validates email format only when an email was supplied', () => {
    render(<LeadCaptureModal />);
    showByTimer();
    fillValidForm();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }));
    expect(screen.getByRole('alert')).toHaveTextContent('כתובת האימייל אינה תקינה.');
    expect(state.submit).not.toHaveBeenCalled();
  });

  it('silently ignores bots that fill the hidden website honeypot', () => {
    render(<LeadCaptureModal />);
    showByTimer();
    fillValidForm();
    const website = document.querySelector<HTMLInputElement>('input[autocomplete="off"]')!;
    fireEvent.change(website, { target: { value: 'bot.example' } });
    fireEvent.click(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }));
    expect(state.submit).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits all fields, shows busy state, then success and allows dismissing the success view', async () => {
    let resolve!: (value: { id: string }) => void;
    state.submit.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    render(<LeadCaptureModal />);
    showByTimer();
    fillValidForm();
    fireEvent.change(screen.getByLabelText('אימייל'), { target: { value: ' nisan@example.com ' } });
    fireEvent.change(screen.getByLabelText('תאריך האירוע'), { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }));

    expect(screen.getByRole('button', { name: 'שולחים…' })).toBeDisabled();
    expect(state.submit).toHaveBeenCalledWith({
      fullName: 'ניסן סיני',
      phone: '054-1234567',
      email: 'nisan@example.com',
      estimatedEventDate: '2026-09-01'
    });

    await act(async () => {
      resolve({ id: 'lead-1' });
      await Promise.resolve();
    });
    expect(screen.getByText('הפרטים התקבלו באהבה')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('ld-event-design-lead-popup-dismissed')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'איזה כיף, תודה!' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a recoverable error when lead submission fails and re-enables submit', async () => {
    state.submit.mockRejectedValueOnce(new Error('network'));
    render(<LeadCaptureModal />);
    showByTimer();
    fillValidForm();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו לשלוח כרגע');
    expect(screen.getByRole('button', { name: 'כן, אשמח לשיחת ייעוץ במתנה' })).toBeEnabled();
  });
});
