import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()
const mockFrom = vi.fn()
const mockSendSubscriptionEmail = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: unknown[]) => mockFrom(...args),
  })),
}))

vi.mock('@/lib/email/send-subscription', () => ({
  sendSubscriptionEmail: (...args: unknown[]) => mockSendSubscriptionEmail(...args),
}))

const { POST } = await import('./route')

function makeRequest(body: string, signature: string | null = 'sig_test') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature } : {},
  })
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  })

  it('returns 400 when signature is missing', async () => {
    const response = await POST(makeRequest('{}', null))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Missing signature')
  })

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Invalid signature')
  })

  it('checkout.session.completed updates plan to pro and sends email', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          metadata: { userId: 'user-1' },
        },
      },
    })

    const updateEq = vi.fn().mockReturnValue({ data: null, error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              plan: 'free',
              email: 'test@example.com',
              name: 'Test User',
              stripe_customer_id: null,
            },
            error: null,
          }),
        }),
      }),
      update: updateFn,
    })

    mockSendSubscriptionEmail.mockResolvedValue(undefined)

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.received).toBe(true)

    expect(updateFn).toHaveBeenCalledWith({
      plan: 'pro',
      stripe_customer_id: 'cus_123',
    })
    expect(updateEq).toHaveBeenCalledWith('id', 'user-1')
    expect(mockSendSubscriptionEmail).toHaveBeenCalledWith('test@example.com', 'Test User')
  })

  it('customer.subscription.deleted sets plan to free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    })

    const updateEq = vi.fn().mockReturnValue({ data: null, error: null })
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { plan: 'pro' },
            error: null,
          }),
        }),
      }),
      update: updateFn,
    })

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(200)
    expect(updateFn).toHaveBeenCalledWith({ plan: 'free' })
    expect(updateEq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123')
  })

  it('unknown event type returns 200 (acknowledged but ignored)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'some.unknown.event',
      data: { object: {} },
    })

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.received).toBe(true)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('idempotent: checkout.session.completed skips if already pro', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          metadata: { userId: 'user-1' },
        },
      },
    })

    const updateFn = vi.fn()

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: {
              plan: 'pro',
              email: 'test@example.com',
              name: 'Test User',
              stripe_customer_id: 'cus_123',
            },
            error: null,
          }),
        }),
      }),
      update: updateFn,
    })

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(200)
    expect(updateFn).not.toHaveBeenCalled()
    expect(mockSendSubscriptionEmail).not.toHaveBeenCalled()
  })

  it('idempotent: subscription.deleted skips if already free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_123',
        },
      },
    })

    const updateFn = vi.fn()

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({
            data: { plan: 'free' },
            error: null,
          }),
        }),
      }),
      update: updateFn,
    })

    const response = await POST(makeRequest('{}'))

    expect(response.status).toBe(200)
    expect(updateFn).not.toHaveBeenCalled()
  })
})
