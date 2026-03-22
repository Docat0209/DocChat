import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { getUsageStatus } from '@/lib/usage/check-limits'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const usage = await getUsageStatus(user.id)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage status' }, { status: 500 })
  }
}
