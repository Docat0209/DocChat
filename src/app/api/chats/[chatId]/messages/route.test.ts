import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockChatQuery = vi.fn()
const mockMessagesQuery = vi.fn()

vi.mock('@/lib/auth/get-user', () => ({
  getAuthenticatedUser: () => mockGetUser(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'chats') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => mockChatQuery(),
              }),
            }),
          }),
        }
      }
      if (table === 'messages') {
        return {
          select: () => ({
            eq: () => ({
              order: () => mockMessagesQuery(),
            }),
          }),
        }
      }
      return {}
    },
  })),
}))

const { GET } = await import('./route')

function createRequest() {
  return new Request('http://localhost/api/chats/chat-1/messages')
}

function createParams(chatId = 'chat-1') {
  return { params: Promise.resolve({ chatId }) }
}

describe('GET /api/chats/[chatId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(null)

    const response = await GET(createRequest(), createParams())

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when chat does not belong to user', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })
    mockChatQuery.mockReturnValueOnce({ data: null, error: { code: 'PGRST116' } })

    const response = await GET(createRequest(), createParams())

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('Chat not found')
  })

  it('returns messages for a chat', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })
    mockChatQuery.mockReturnValueOnce({ data: { id: 'chat-1' }, error: null })

    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        sources: null,
        created_at: '2026-03-22T10:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        sources: [{ pageNumber: 1, content: 'some context' }],
        created_at: '2026-03-22T10:00:01Z',
      },
    ]

    mockMessagesQuery.mockReturnValueOnce({ data: mockMessages, error: null })

    const response = await GET(createRequest(), createParams())

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(mockMessages)
    expect(body).toHaveLength(2)
    expect(body[0].role).toBe('user')
    expect(body[1].role).toBe('assistant')
  })

  it('returns 500 when messages query fails', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 'user-1' })
    mockChatQuery.mockReturnValueOnce({ data: { id: 'chat-1' }, error: null })
    mockMessagesQuery.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })

    const response = await GET(createRequest(), createParams())

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('DB error')
  })
})
