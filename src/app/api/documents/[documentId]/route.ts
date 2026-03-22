import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await params
    const supabase = createAdminClient()

    // Verify the document belongs to the user
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id, file_url, name')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from storage
    const storagePath = `documents/${user.id}/${documentId}/${document.name}`
    await supabase.storage.from('documents').remove([storagePath])

    // Delete from DB (cascade handles chunks, chats, messages)
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', documentId)

    if (deleteError) {
      console.error('Document delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete handler error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
