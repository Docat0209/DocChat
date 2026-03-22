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

  it('shows error when Google OAuth provider is not configured', async () => {
    mockSignInWithOAuth.mockResolvedValueOnce({
      error: { message: 'Unsupported provider: provider is not enabled' },
    })

    render(<LoginPage />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await userEvent.click(googleButton)

    expect(
      await screen.findByText(
        'Google OAuth is not configured yet. Please use email/password to sign in.',
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

    expect(screen.queryByText(/Google OAuth is not configured/i)).not.toBeInTheDocument()
  })
})
