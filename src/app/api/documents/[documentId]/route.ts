import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { apiError } from '@/lib/api-error'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
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
      return apiError('Document not found', 'NOT_FOUND', 404)
    }

    if (document.user_id !== user.id) {
      return apiError('Forbidden', 'FORBIDDEN', 403)
    }

    // Delete from storage
    const storagePath = `documents/${user.id}/${documentId}/${document.name}`
    await supabase.storage.from('documents').remove([storagePath])

    // Delete from DB (cascade handles chunks, chats, messages)
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', documentId)

    if (deleteError) {
      console.error('Document delete error:', deleteError)
      return apiError('Failed to delete document', 'DELETE_ERROR', 500)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete handler error:', error)
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
