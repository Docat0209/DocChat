import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const documentId = request.nextUrl.searchParams.get('documentId')
    if (!documentId) {
      return apiError('documentId is required', 'MISSING_PARAM', 400)
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return apiError(error.message, 'DB_ERROR', 500)
    }

    return NextResponse.json(data)
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
