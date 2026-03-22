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

describe('LoginPage — Google OAuth button visibility', () => {
  it('hides Google button when NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED is not true', () => {
    render(<LoginPage />)
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
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
