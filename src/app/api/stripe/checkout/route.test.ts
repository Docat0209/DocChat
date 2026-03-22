import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockCustomersCreate = vi.fn()
const mockCheckoutSessionsCreate = vi.fn()

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
    customers: { create: (...args: unknown[]) => mockCustomersCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args) } },
  }),
}))

vi.mock('@/lib/stripe/config', () => ({
  STRIPE_CONFIG: {
    prices: { pro: 'price_test_123' },
    plans: {
      free: { name: 'Free', documents: 3, questionsPerDay: 20 },
      pro: { name: 'Pro', price: 9, documents: Infinity, questionsPerDay: Infinity },
    },
  },
}))

const { POST } = await import('./route')

describe('POST /api/stripe/checkout', () => {
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

  it('creates checkout session with new Stripe customer', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { stripe_customer_id: null, email: 'test@example.com', plan: 'free' },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({ data: null, error: null }),
      }),
    })

    mockCustomersCreate.mockResolvedValueOnce({ id: 'cus_new_123' })
    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/session' })

    const response = await POST()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.url).toBe('https://checkout.stripe.com/session')

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { supabase_user_id: 'user-1' },
    })

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_new_123',
        mode: 'subscription',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
      }),
    )
  })

  it('reuses existing Stripe customer', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              stripe_customer_id: 'cus_existing_456',
              email: 'test@example.com',
              plan: 'free',
            },
            error: null,
          }),
        }),
      }),
    })

    mockCheckoutSessionsCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/session' })

    const response = await POST()

    expect(response.status).toBe(200)
    expect(mockCustomersCreate).not.toHaveBeenCalled()

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing_456',
      }),
    )
  })

  it('returns 400 when already on Pro plan', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { stripe_customer_id: 'cus_123', email: 'test@example.com', plan: 'pro' },
            error: null,
          }),
        }),
      }),
    })

    const response = await POST()

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Already on Pro plan')
  })
})
