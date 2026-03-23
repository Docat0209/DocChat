import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { getUsageStatus } from '@/lib/usage/check-limits'
import { apiError } from '@/lib/api-error'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    const usage = await getUsageStatus(user.id)
    return NextResponse.json(usage, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return apiError('Failed to fetch usage status', 'USAGE_ERROR', 500)
  }
}
