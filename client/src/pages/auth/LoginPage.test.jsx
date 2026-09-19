import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/apiClient', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const { ApiError, http } = await import('@/services/apiClient');
const { useAuthStore } = await import('@/store/authStore');
const { default: LoginPage } = await import('./LoginPage');

function renderLogin(initialEntry = '/login') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<p>Account home</p>} />
          <Route path="/checkout" element={<p>Checkout page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const user = { _id: 'u1', name: 'Jane Doe', email: 'jane@example.com', role: 'USER', isEmailVerified: true };

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, status: 'guest' });
  });

  it('shows validation errors and does not call the API for an empty form', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'whatever');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('signs in with normalised credentials and navigates to the account', async () => {
    http.post.mockResolvedValueOnce({ user });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), '  Jane@Example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Account home')).toBeInTheDocument();
    expect(http.post).toHaveBeenCalledWith('/auth/login', { email: 'jane@example.com', password: 'Secret123' });
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('honours a safe redirect parameter', async () => {
    http.post.mockResolvedValueOnce({ user });
    renderLogin('/login?redirect=%2Fcheckout');

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Checkout page')).toBeInTheDocument();
  });

  it('ignores an external redirect parameter', async () => {
    http.post.mockResolvedValueOnce({ user });
    renderLogin('/login?redirect=%2F%2Fevil.example.com');

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Account home')).toBeInTheDocument();
  });

  it('shows an alert when the credentials are wrong', async () => {
    http.post.mockRejectedValueOnce(new ApiError('Invalid email or password', { status: 401 }));
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The email or password you entered is incorrect.');
    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled());
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('maps server field errors onto the inputs', async () => {
    http.post.mockRejectedValueOnce(
      new ApiError('Validation failed', { status: 422, errors: [{ field: 'body.email', message: 'This email is not allowed' }] }),
    );
    renderLogin();

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('This email is not allowed')).toBeInTheDocument();
  });
});
