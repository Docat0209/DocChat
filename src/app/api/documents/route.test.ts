import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockQueryResult = vi.fn()

vi.mock('@/lib/auth/get-user', () => ({
  getAuthenticatedUser: () => mockGetUser(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => mockQueryResult(),
        }),
      }),
    }),
  })),
}))

const { GET } = await import('./route')

describe('GET /api/documents', () => {
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

  it('returns documents for authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    const mockDocs = [
      { id: 'doc-1', name: 'test.pdf', status: 'ready', created_at: '2026-03-22T10:00:00Z' },
      { id: 'doc-2', name: 'notes.txt', status: 'processing', created_at: '2026-03-22T09:00:00Z' },
    ]

    mockQueryResult.mockReturnValueOnce({ data: mockDocs, error: null })

    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(mockDocs)
    expect(body).toHaveLength(2)
  })

  it('returns 500 when database query fails', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })
    mockQueryResult.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })

    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Failed to fetch documents')
    expect(body.code).toBe('FETCH_ERROR')
  })
})
