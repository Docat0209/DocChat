import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-error'

export async function GET(_request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { chatId } = await params

    const supabase = await createClient()

    // Verify chat belongs to user
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()

    if (chatError || !chat) {
      return apiError('Chat not found', 'NOT_FOUND', 404)
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, sources, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      return apiError(error.message, 'DB_ERROR', 500)
    }

    return NextResponse.json(data)
  } catch {
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
