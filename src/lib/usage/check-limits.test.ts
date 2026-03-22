import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockProfileQuery = vi.fn()
const mockDocumentCount = vi.fn()
const mockProfileUpdate = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockProfileQuery(),
            }),
          }),
          update: (data: Record<string, unknown>) => {
            mockProfileUpdate(data)
            return { eq: () => ({ error: null }) }
          },
        }
      }
      if (table === 'documents') {
        return {
          select: () => ({
            eq: () => mockDocumentCount(),
          }),
        }
      }
      return {}
    },
  }),
}))

vi.mock('@/lib/stripe/config', () => ({
  STRIPE_CONFIG: {
    plans: {
      free: { name: 'Free', documents: 3, questionsPerDay: 20 },
      pro: { name: 'Pro', price: 9, documents: Infinity, questionsPerDay: Infinity },
    },
  },
}))

const { getUsageStatus, incrementQuestionCount } = await import('./check-limits')

describe('getUsageStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('free user with 2 docs can upload', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'free',
        question_count_today: 5,
        question_count_reset_at: new Date().toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 2, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.documents.current).toBe(2)
    expect(result.documents.limit).toBe(3)
    expect(result.documents.canUpload).toBe(true)
  })

  it('free user with 3 docs cannot upload', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'free',
        question_count_today: 0,
        question_count_reset_at: new Date().toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 3, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.documents.current).toBe(3)
    expect(result.documents.canUpload).toBe(false)
  })

  it('free user with 19 questions can ask', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'free',
        question_count_today: 19,
        question_count_reset_at: new Date().toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 0, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.questions.current).toBe(19)
    expect(result.questions.limit).toBe(20)
    expect(result.questions.canAsk).toBe(true)
  })

  it('free user with 20 questions cannot ask', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'free',
        question_count_today: 20,
        question_count_reset_at: new Date().toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 0, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.questions.current).toBe(20)
    expect(result.questions.canAsk).toBe(false)
  })

  it('pro user always has unlimited access', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'pro',
        question_count_today: 999,
        question_count_reset_at: new Date().toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 100, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.plan).toBe('pro')
    expect(result.documents.canUpload).toBe(true)
    expect(result.questions.canAsk).toBe(true)
  })

  it('resets daily counter when reset_at is yesterday', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    mockProfileQuery.mockReturnValueOnce({
      data: {
        plan: 'free',
        question_count_today: 15,
        question_count_reset_at: yesterday.toISOString(),
      },
      error: null,
    })
    mockDocumentCount.mockReturnValueOnce({ count: 0, error: null })

    const result = await getUsageStatus('user-1')

    expect(result.questions.current).toBe(0)
    expect(result.questions.canAsk).toBe(true)
    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ question_count_today: 0 }),
    )
  })
})

describe('incrementQuestionCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('increments the count when reset_at is today', async () => {
    mockProfileQuery.mockReturnValueOnce({
      data: { question_count_today: 5, question_count_reset_at: new Date().toISOString() },
      error: null,
    })

    await incrementQuestionCount('user-1')

    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ question_count_today: 6 }),
    )
  })

  it('resets to 1 when reset_at is yesterday', async () => {
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)

    mockProfileQuery.mockReturnValueOnce({
      data: { question_count_today: 15, question_count_reset_at: yesterday.toISOString() },
      error: null,
    })

    await incrementQuestionCount('user-1')

    expect(mockProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ question_count_today: 1 }),
    )
  })
})
