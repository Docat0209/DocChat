import { describe, it, expect, vi } from 'vitest'

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

const { getAuthenticatedUser } = await import('./get-user')

describe('getAuthenticatedUser', () => {
  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null })

    const result = await getAuthenticatedUser()
    expect(result).toEqual(mockUser)
  })

  it('returns null when no session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

    const result = await getAuthenticatedUser()
    expect(result).toBeNull()
  })

  it('returns null when auth error occurs', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid token' },
    })

    const result = await getAuthenticatedUser()
    expect(result).toBeNull()
  })
})
