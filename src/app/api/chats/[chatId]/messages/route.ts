import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, sources, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
