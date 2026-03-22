import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockPortalSessionsCreate = vi.fn()

vi.mock('@/lib/auth/get-user', () => ({
  getAuthenticatedUser: () => mockGetUser(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    billingPortal: {
      sessions: { create: (...args: unknown[]) => mockPortalSessionsCreate(...args) },
    },
  }),
}))

const { POST } = await import('./route')

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(null)

    const response = await POST()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when no stripe_customer_id exists', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { stripe_customer_id: null },
            error: null,
          }),
        }),
      }),
    })

    const response = await POST()

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('No billing account found')
  })

  it('creates portal session successfully', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { stripe_customer_id: 'cus_123' },
            error: null,
          }),
        }),
      }),
    })

    mockPortalSessionsCreate.mockResolvedValueOnce({ url: 'https://billing.stripe.com/session' })

    const response = await POST()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toBe('https://billing.stripe.com/session')

    expect(mockPortalSessionsCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'http://localhost:3000/',
    })
  })
})
