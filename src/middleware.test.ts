import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

const { middleware } = await import('./middleware')

function createRequest(pathname: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000')
  return new NextRequest(url)
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows unauthenticated user on / (landing page)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const response = await middleware(createRequest('/'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.status).not.toBe(307)
  })

  it('redirects unauthenticated user on /dashboard to /login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const response = await middleware(createRequest('/dashboard'))

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
  })

  it('redirects unauthenticated user on /chat/123 to /login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const response = await middleware(createRequest('/chat/123'))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
  })

  it('redirects authenticated user on / to /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    })

    const response = await middleware(createRequest('/'))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('redirects authenticated user on /login to /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    })

    const response = await middleware(createRequest('/login'))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('redirects authenticated user on /signup to /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    })

    const response = await middleware(createRequest('/signup'))

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/dashboard')
  })

  it('allows authenticated user on /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    })

    const response = await middleware(createRequest('/dashboard'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.status).not.toBe(307)
  })

  it('allows authenticated user on /chat/123', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
    })

    const response = await middleware(createRequest('/chat/123'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.status).not.toBe(307)
  })

  it('allows unauthenticated user on /auth/callback', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const response = await middleware(createRequest('/auth/callback'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.status).not.toBe(307)
  })
})
