import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { retrieveChunks, type RetrievedChunk } from '@/lib/rag/retrieve'
import { getUsageStatus, incrementQuestionCount } from '@/lib/usage/check-limits'
import { apiError } from '@/lib/api-error'

function buildSystemPrompt(context: string): string {
  return `You are a helpful document assistant. Answer questions based ONLY on the provided context.
Always cite your sources using [Page X] format. If the context doesn't contain enough information to answer, say "I don't have enough information in this document to answer that question."

Context from the document:
${context}`
}

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c) => `[Page ${c.pageNumber}]: ${c.content}`).join('\n\n')
}

function buildSources(chunks: RetrievedChunk[]) {
  return chunks.map((c) => ({
    pageNumber: c.pageNumber,
    content: c.content.slice(0, 200),
  }))
}

function extractTextFromUIMessage(message: UIMessage): string {
  const textParts = message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
  return textParts.join(' ')
}

async function getOrCreateChat(
  documentId: string,
  chatId: string | undefined,
  userId: string,
  firstMessageContent: string,
): Promise<string> {
  const adminClient = createAdminClient()

  if (chatId) {
    const { data, error } = await adminClient
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      throw new Error('Chat not found')
    }

    return chatId
  }

  const trimmed = firstMessageContent.trim()
  const title =
    trimmed.length < 3
      ? `Chat ${new Date().toLocaleDateString()}`
      : trimmed.slice(0, 50) + (trimmed.length > 50 ? '...' : '')

  const { data, error } = await adminClient
    .from('chats')
    .insert({
      document_id: documentId,
      user_id: userId,
      title,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Failed to create chat: ${error?.message ?? 'Unknown error'}`)
  }

  return data.id
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const {
      messages,
      documentId,
      id: chatId,
    } = body as {
      messages: UIMessage[]
      documentId: string | undefined
      id: string | undefined
    }

    const usage = await getUsageStatus(user.id)
    if (!usage.questions.canAsk) {
      return apiError(
        'Daily question limit reached. Upgrade to Pro for unlimited questions.',
        'QUESTION_LIMIT',
        403,
      )
    }

    if (!documentId) {
      return apiError('documentId is required', 'MISSING_DOCUMENT_ID', 400)
    }

    if (!messages || messages.length === 0) {
      return apiError('messages array must not be empty', 'EMPTY_MESSAGES', 400)
    }

    const lastMessage = messages[messages.length - 1]

    if (lastMessage.role !== 'user') {
      return apiError('Last message must be from user', 'INVALID_ROLE', 400)
    }

    // Verify document exists, is ready, and belongs to the authenticated user
    const adminClient = createAdminClient()
    const { data: document, error: docError } = await adminClient
      .from('documents')
      .select('id, status, user_id')
      .eq('id', documentId)
      .single()

    if (docError || !document || document.user_id !== user.id) {
      return apiError('Document not found', 'DOCUMENT_NOT_FOUND', 404)
    }

    if (document.status !== 'ready') {
      return apiError(
        `Document is not ready for chat. Current status: ${document.status}`,
        'DOCUMENT_NOT_READY',
        400,
      )
    }

    // Extract user text from the UIMessage parts
    const userContent = extractTextFromUIMessage(lastMessage)

    // Retrieve relevant chunks via vector similarity
    const chunks = await retrieveChunks(userContent, documentId)
    const context = buildContext(chunks)
    const systemPrompt = buildSystemPrompt(context)

    // Create or get chat record
    const resolvedChatId = await getOrCreateChat(documentId, chatId, user.id, userContent)

    // Save user message to DB
    await adminClient.from('messages').insert({
      chat_id: resolvedChatId,
      role: 'user' as const,
      content: userContent,
    })

    // Convert UIMessages to ModelMessages for streamText
    const modelMessages = await convertToModelMessages(messages)

    // Stream response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        // Save assistant message with sources metadata
        await adminClient.from('messages').insert({
          chat_id: resolvedChatId,
          role: 'assistant' as const,
          content: text,
          sources: buildSources(chunks),
        })
        await incrementQuestionCount(user.id)
      },
    })

    return result.toUIMessageStreamResponse({
      headers: {
        'x-chat-id': resolvedChatId,
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return apiError('Internal server error', 'INTERNAL_ERROR', 500)
  }
}
