import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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
          eq: () => ({
            order: () => mockQueryResult(),
          }),
        }),
      }),
    }),
  })),
}))

const { GET } = await import('./route')

describe('GET /api/chats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/chats?documentId=doc-1')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when documentId is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    const request = new NextRequest('http://localhost/api/chats')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('documentId is required')
  })

  it('returns chats for a document', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    const mockChats = [
      { id: 'chat-1', title: 'First question', created_at: '2026-03-22T10:00:00Z' },
      { id: 'chat-2', title: 'Second question', created_at: '2026-03-22T09:00:00Z' },
    ]

    mockQueryResult.mockReturnValueOnce({ data: mockChats, error: null })

    const request = new NextRequest('http://localhost/api/chats?documentId=doc-1')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(mockChats)
  })

  it('returns 500 when database query fails', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })

    mockQueryResult.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })

    const request = new NextRequest('http://localhost/api/chats?documentId=doc-1')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('DB error')
  })
})
