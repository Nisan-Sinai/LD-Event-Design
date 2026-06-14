import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireAdmin } from './guards';

const auth = vi.hoisted(() => ({
  value: { user: null as unknown, role: 'guest', loading: false, configured: true }
}));
vi.mock('./AuthProvider', () => ({ useAuth: () => auth.value }));

function renderAt(el: React.ReactElement, path = '/secret') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/secret" element={el} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/" element={<div>HOME PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  auth.value = { user: null, role: 'guest', loading: false, configured: true };
});

describe('RequireAuth', () => {
  it('shows a spinner while loading', () => {
    auth.value = { user: null, role: 'guest', loading: true, configured: true };
    renderAt(<RequireAuth><div>SECRET</div></RequireAuth>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login when configured and not logged in', () => {
    renderAt(<RequireAuth><div>SECRET</div></RequireAuth>);
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('allows access when not configured (guest fallback)', () => {
    auth.value = { user: null, role: 'guest', loading: false, configured: false };
    renderAt(<RequireAuth><div>SECRET</div></RequireAuth>);
    expect(screen.getByText('SECRET')).toBeInTheDocument();
  });

  it('allows access when logged in', () => {
    auth.value = { user: { id: '1' }, role: 'customer', loading: false, configured: true };
    renderAt(<RequireAuth><div>SECRET</div></RequireAuth>);
    expect(screen.getByText('SECRET')).toBeInTheDocument();
  });
});

describe('RequireAdmin', () => {
  it('shows a spinner while loading', () => {
    auth.value = { user: null, role: 'guest', loading: true, configured: true };
    renderAt(<RequireAdmin><div>ADMIN</div></RequireAdmin>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to /login when not logged in', () => {
    renderAt(<RequireAdmin><div>ADMIN</div></RequireAdmin>);
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('redirects home when logged in but not admin', () => {
    auth.value = { user: { id: '1' }, role: 'customer', loading: false, configured: true };
    renderAt(<RequireAdmin><div>ADMIN</div></RequireAdmin>);
    expect(screen.getByText('HOME PAGE')).toBeInTheDocument();
  });

  it('allows access for an admin', () => {
    auth.value = { user: { id: '1' }, role: 'admin', loading: false, configured: true };
    renderAt(<RequireAdmin><div>ADMIN</div></RequireAdmin>);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
