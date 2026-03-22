import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSignInWithOAuth = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

const { default: LoginPage } = await import('./page')

describe('LoginPage — Google OAuth error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows user-friendly error when provider is not enabled', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      error: { message: 'Unsupported provider: provider is not enabled' },
    })

    render(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await userEvent.click(googleButton)

    expect(
      await screen.findByText(
        'Google sign-in is not available yet. Please use email and password.',
      ),
    ).toBeInTheDocument()
  })

  it('shows user-friendly error when error_code is validation_failed', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      error: { message: 'Some error', error_code: 'validation_failed' },
    })

    render(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await userEvent.click(googleButton)

    expect(
      await screen.findByText(
        'Google sign-in is not available yet. Please use email and password.',
      ),
    ).toBeInTheDocument()
  })

  it('shows generic error message for other OAuth failures', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      error: { message: 'Network request failed' },
    })

    render(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await userEvent.click(googleButton)

    expect(await screen.findByText('Network request failed')).toBeInTheDocument()
  })

  it('does not show error when OAuth succeeds (redirects)', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({ error: null })

    render(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await userEvent.click(googleButton)

    expect(screen.queryByText(/Google sign-in is not available/i)).not.toBeInTheDocument()
  })
})

describe('LoginPage — email login redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls signInWithPassword on form submit', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(submitButton)

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('shows error when login fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'wrongpassword')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(submitButton)

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })
})
