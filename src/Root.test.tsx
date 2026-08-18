import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./auth/AuthProvider', () => ({ AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('./packages/PackagesProvider', () => ({ PackagesProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('./cart/CartProvider', () => ({ CartProvider: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('./auth/guards', () => ({
  RequireAdmin: ({ children }: { children: ReactNode }) => <>{children}</>,
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>
}));
vi.mock('./components/SiteLayout', () => ({ SiteLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('./components/Spinner', () => ({ Spinner: () => <div>loading</div> }));
vi.mock('./pages/HomePage', () => ({ HomePage: () => <div>HOME</div> }));
vi.mock('./pages/AdminPage', () => ({ AdminPage: () => <div>ADMIN</div> }));
vi.mock('./pages/AccountPage', () => ({ AccountPage: () => <div>ACCOUNT</div> }));
vi.mock('./pages/CartPage', () => ({ CartPage: () => <div>CART</div> }));
vi.mock('./pages/CheckoutPage', () => ({ CheckoutPage: () => <div>CHECKOUT</div> }));
vi.mock('./pages/LoginPage', () => ({ LoginPage: () => <div>LOGIN</div> }));
vi.mock('./pages/RegisterPage', () => ({ RegisterPage: () => <div>REGISTER</div> }));
vi.mock('./pages/ResetPasswordPage', () => ({ ResetPasswordPage: () => <div>RESET</div> }));

import { Root } from './Root';

const scrollTo = vi.fn();
const scrollIntoView = vi.fn();

async function flushLazy() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderAt(path: string, expected: string) {
  window.history.replaceState({}, '', path);
  const rendered = render(<Root />);
  await flushLazy();
  expect(screen.getByText(expected)).toBeInTheDocument();
  return rendered;
}

beforeEach(() => {
  scrollTo.mockReset();
  scrollIntoView.mockReset();
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo });
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 7;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  document.body.innerHTML = '<div id="test-root"></div>';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Root', () => {
  it.each([
    ['/','HOME'],
    ['/cart','CART'],
    ['/checkout','CHECKOUT'],
    ['/login','LOGIN'],
    ['/register','REGISTER'],
    ['/reset-password','RESET'],
    ['/account','ACCOUNT'],
    ['/admin','ADMIN']
  ])('renders route %s', async (path, expected) => {
    const rendered = await renderAt(path, expected);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    rendered.unmount();
  });

  it('redirects unknown routes to home', async () => {
    const rendered = await renderAt('/does-not-exist', 'HOME');
    expect(window.location.pathname).toBe('/');
    rendered.unmount();
  });

  it('redirects the legacy order route to the package builder hash', async () => {
    window.history.replaceState({}, '', '/order');
    const rendered = render(<Root />);
    await flushLazy();
    expect(window.location.pathname).toBe('/');
    expect(window.location.hash).toBe('#packages');
    rendered.unmount();
  });

  it('aligns an existing decoded hash target immediately and during animation-frame passes', async () => {
    window.history.replaceState({}, '', '/#design%2Ddetails');
    const target = document.createElement('section');
    target.id = 'design-details';
    document.body.append(target);

    const rendered = render(<Root />);
    await flushLazy();
    expect(screen.getByText('HOME')).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
    expect(scrollIntoView.mock.calls.length).toBeGreaterThanOrEqual(3);
    rendered.unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(7);
  });

  it('keeps an invalid encoded hash and waits until lazy content creates its target', async () => {
    window.history.replaceState({}, '', '/#bad%ZZ');
    const rendered = render(<Root />);
    await flushLazy();
    expect(screen.getByText('HOME')).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();

    const target = document.createElement('div');
    target.id = 'bad%ZZ';
    document.body.append(target);
    await flushLazy();
    expect(scrollIntoView).toHaveBeenCalled();
    rendered.unmount();
  });

  it('cancels outstanding alignment work when a missing hash route unmounts', async () => {
    window.history.replaceState({}, '', '/#never-created');
    const rendered = render(<Root />);
    await flushLazy();
    expect(screen.getByText('HOME')).toBeInTheDocument();
    rendered.unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
