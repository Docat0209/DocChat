import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeDate } from './format-relative-date'

describe('formatRelativeDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function setNow(date: Date) {
    vi.useFakeTimers()
    vi.setSystemTime(date)
  }

  const base = new Date('2026-03-22T12:00:00Z')

  it('returns "just now" for less than a minute ago', () => {
    setNow(base)
    const thirtySecondsAgo = new Date(base.getTime() - 30 * 1000).toISOString()
    expect(formatRelativeDate(thirtySecondsAgo)).toBe('just now')
  })

  it('returns minutes ago', () => {
    setNow(base)
    const fiveMinutesAgo = new Date(base.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeDate(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    setNow(base)
    const threeHoursAgo = new Date(base.getTime() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago', () => {
    setNow(base)
    const twoDaysAgo = new Date(base.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(twoDaysAgo)).toBe('2d ago')
  })

  it('returns weeks ago', () => {
    setNow(base)
    const twoWeeksAgo = new Date(base.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2w ago')
  })

  it('returns months ago', () => {
    setNow(base)
    const threeMonthsAgo = new Date(base.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(threeMonthsAgo)).toBe('3mo ago')
  })

  it('returns years ago', () => {
    setNow(base)
    const twoYearsAgo = new Date(base.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeDate(twoYearsAgo)).toBe('2y ago')
  })
})
