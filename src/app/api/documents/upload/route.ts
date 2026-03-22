import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractText } from '@/lib/extraction/extract-text'
import { processDocument } from '@/lib/pipeline/process-document'
import { generateSuggestedQuestions } from '@/lib/pipeline/generate-questions'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { getUsageStatus } from '@/lib/usage/check-limits'
import { apiError } from '@/lib/api-error'
import type { DocumentInsert } from '@/types/database'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'txt'])

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const usage = await getUsageStatus(user.id)
    if (!usage.documents.canUpload) {
      return NextResponse.json(
        {
          error: 'Document limit reached. Upgrade to Pro for unlimited documents.',
          code: 'DOCUMENT_LIMIT',
        },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    // Validate file exists
    if (!file || !(file instanceof File)) {
      return apiError('No file provided', 'NO_FILE', 400)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is 20MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 413 },
      )
    }

    // Validate MIME type
    const mimeType = file.type
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      // Fallback: check extension
      const ext = getFileExtension(file.name)
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${mimeType || 'unknown'}. Supported: PDF, DOCX, TXT` },
          { status: 415 },
        )
      }
    }

    // Validate extension matches MIME type
    const ext = getFileExtension(file.name)
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Unsupported file extension: .${ext}. Supported: .pdf, .docx, .txt` },
        { status: 415 },
      )
    }

    const supabase = createAdminClient()

    const userId = user.id
    const documentId = crypto.randomUUID()
    const storagePath = `documents/${userId}/${documentId}/${file.name}`

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return apiError(
        `Failed to upload file to storage: ${uploadError.message}`,
        'STORAGE_ERROR',
        500,
      )
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(storagePath)

    // Determine file type string for the DB record
    const fileType = ALLOWED_MIME_TYPES[mimeType] ?? ext

    // Create document record with status "processing"
    const documentInsert: DocumentInsert = {
      id: documentId,
      user_id: userId,
      name: file.name,
      file_url: publicUrl,
      file_type: fileType,
      status: 'processing',
    }

    const { error: insertError } = await supabase.from('documents').insert(documentInsert)

    if (insertError) {
      console.error('Document insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath])
      return apiError('Failed to create document record', 'INSERT_ERROR')
    }

    // Resolve the effective MIME type for extraction
    const effectiveMimeType = ALLOWED_MIME_TYPES[mimeType]
      ? mimeType
      : ext === 'pdf'
        ? 'application/pdf'
        : ext === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/plain'

    // Extract text from the file
    let extractionResult
    try {
      extractionResult = await extractText(buffer, effectiveMimeType)
    } catch (extractionError) {
      console.error('Extraction error:', extractionError)

      await supabase
        .from('documents')
        .update({ status: 'failed' as const })
        .eq('id', documentId)

      const detail = extractionError instanceof Error ? extractionError.message : 'Unknown error'
      return apiError(
        `Failed to extract text from ${fileType.toUpperCase()} file: ${detail}`,
        'EXTRACTION_ERROR',
      )
    }

    // Chunk text and generate embeddings
    try {
      await processDocument({
        documentId,
        pages: extractionResult.pages,
      })

      await supabase
        .from('documents')
        .update({ status: 'ready' as const })
        .eq('id', documentId)

      // Fire-and-forget: generate suggested questions without blocking the response
      const chunks = extractionResult.pages.map((p) => ({
        content: p.content,
        pageNumber: p.pageNumber,
      }))
      generateSuggestedQuestions(chunks)
        .then(async (questions) => {
          if (questions.length > 0) {
            await supabase
              .from('documents')
              .update({ suggested_questions: questions })
              .eq('id', documentId)
          }
        })
        .catch((err) => {
          console.error('Failed to generate suggested questions:', err)
        })
    } catch (pipelineError) {
      console.error('Pipeline error:', pipelineError)

      await supabase
        .from('documents')
        .update({ status: 'failed' as const })
        .eq('id', documentId)

      const detail = pipelineError instanceof Error ? pipelineError.message : 'Unknown error'
      const pipelineStep = detail.includes('chunks')
        ? 'Failed to store document chunks'
        : detail.includes('embedding') || detail.includes('openai')
          ? 'Failed to generate embeddings'
          : 'Failed to process document for chat'

      return NextResponse.json({
        id: documentId,
        name: file.name,
        fileType,
        status: 'failed',
        error: `${pipelineStep}: ${detail}`,
      })
    }

    return NextResponse.json({
      id: documentId,
      name: file.name,
      fileType,
      status: 'ready',
      pages: extractionResult,
    })
  } catch (error) {
    console.error('Upload handler error:', error)
    const detail = error instanceof Error ? error.message : 'Unknown error'
    return apiError(`Upload failed: ${detail}`, 'UPLOAD_ERROR')
  }
}
