import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpgradeButton } from './upgrade-button'

const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}))

describe('UpgradeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('shows error toast when checkout returns no URL', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Stripe is not configured' }), { status: 500 }),
    )

    render(<UpgradeButton plan="free" />)

    const button = screen.getByRole('button', { name: /upgrade to pro/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Stripe is not configured')
    })
  })

  it('shows fallback error toast when checkout returns empty response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    )

    render(<UpgradeButton plan="free" />)

    const button = screen.getByRole('button', { name: /upgrade to pro/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Unable to start checkout. Payments may not be configured yet.',
      )
    })
  })

  it('shows error toast when fetch throws a network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(<UpgradeButton plan="free" />)

    const button = screen.getByRole('button', { name: /upgrade to pro/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Unable to start checkout. Please try again later.',
      )
    })
  })

  it('redirects when checkout returns a URL', async () => {
    const locationSpy = vi.spyOn(window, 'location', 'get')
    const mockLocation = { ...window.location, href: '' }
    const hrefSetter = vi.fn()
    Object.defineProperty(mockLocation, 'href', {
      set: hrefSetter,
      get: () => 'http://localhost:3000',
    })
    locationSpy.mockReturnValue(mockLocation as Location)

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/session123' }), {
        status: 200,
      }),
    )

    render(<UpgradeButton plan="free" />)

    const button = screen.getByRole('button', { name: /upgrade to pro/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalledWith('https://checkout.stripe.com/session123')
    })
    expect(mockToastError).not.toHaveBeenCalled()

    locationSpy.mockRestore()
  })
})
