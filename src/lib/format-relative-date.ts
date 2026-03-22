const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7
const MONTH = DAY * 30
const YEAR = DAY * 365

export function formatRelativeDate(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < MINUTE) return 'just now'
  if (seconds < HOUR) {
    const mins = Math.floor(seconds / MINUTE)
    return `${mins}m ago`
  }
  if (seconds < DAY) {
    const hours = Math.floor(seconds / HOUR)
    return `${hours}h ago`
  }
  if (seconds < WEEK) {
    const days = Math.floor(seconds / DAY)
    return `${days}d ago`
  }
  if (seconds < MONTH) {
    const weeks = Math.floor(seconds / WEEK)
    return `${weeks}w ago`
  }
  if (seconds < YEAR) {
    const months = Math.floor(seconds / MONTH)
    return `${months}mo ago`
  }
  const years = Math.floor(seconds / YEAR)
  return `${years}y ago`
}
