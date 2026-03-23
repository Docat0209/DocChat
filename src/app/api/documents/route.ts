import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return apiError('Failed to fetch documents', 'FETCH_ERROR', 500)
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    })
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
