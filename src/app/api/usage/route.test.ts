import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockGetUsageStatus = vi.fn()

vi.mock('@/lib/auth/get-user', () => ({
  getAuthenticatedUser: () => mockGetUser(),
}))

vi.mock('@/lib/usage/check-limits', () => ({
  getUsageStatus: (userId: string) => mockGetUsageStatus(userId),
}))

const { GET } = await import('./route')

describe('GET /api/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(null)

    const response = await GET()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns usage status for authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    const mockUsage = {
      plan: 'free',
      documents: { current: 2, limit: 3, canUpload: true },
      questions: { current: 10, limit: 20, canAsk: true },
    }
    mockGetUsageStatus.mockResolvedValueOnce(mockUsage)

    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(mockUsage)
    expect(mockGetUsageStatus).toHaveBeenCalledWith('user-1')
  })

  it('returns 500 when usage check fails', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })
    mockGetUsageStatus.mockRejectedValueOnce(new Error('DB error'))

    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to fetch usage status')
    expect(body.code).toBe('USAGE_ERROR')
  })
})
