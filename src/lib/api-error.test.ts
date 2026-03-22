import { describe, it, expect } from 'vitest'
import { apiError } from './api-error'

describe('apiError', () => {
  it('returns correct JSON format with error and code', async () => {
    const response = apiError('Something failed', 'SOME_ERROR', 500)
    const body = await response.json()

    expect(body).toEqual({
      error: 'Something failed',
      code: 'SOME_ERROR',
    })
  })

  it('uses the correct status code', () => {
    const response400 = apiError('Bad request', 'BAD_REQUEST', 400)
    expect(response400.status).toBe(400)

    const response401 = apiError('Unauthorized', 'UNAUTHORIZED', 401)
    expect(response401.status).toBe(401)

    const response404 = apiError('Not found', 'NOT_FOUND', 404)
    expect(response404.status).toBe(404)

    const response413 = apiError('Too large', 'TOO_LARGE', 413)
    expect(response413.status).toBe(413)
  })

  it('defaults to 500 status when not specified', async () => {
    const response = apiError('Internal error', 'INTERNAL')
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body).toEqual({
      error: 'Internal error',
      code: 'INTERNAL',
    })
  })

  it('returns application/json content type', () => {
    const response = apiError('Test', 'TEST', 400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
