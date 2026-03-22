import { NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { retrieveChunks, type RetrievedChunk } from '@/lib/rag/retrieve'

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

  const title = firstMessageContent.slice(0, 100) + (firstMessageContent.length > 100 ? '...' : '')

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'messages array must not be empty' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]

    if (lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
    }

    // Verify document exists, is ready, and belongs to the authenticated user
    const adminClient = createAdminClient()
    const { data: document, error: docError } = await adminClient
      .from('documents')
      .select('id, status, user_id')
      .eq('id', documentId)
      .single()

    if (docError || !document || document.user_id !== user.id) {
      // Return 404 for all cases to prevent document enumeration
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.status !== 'ready') {
      return NextResponse.json(
        { error: `Document is not ready for chat. Current status: ${document.status}` },
        { status: 400 },
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
      },
    })

    return result.toUIMessageStreamResponse({
      headers: {
        'x-chat-id': resolvedChatId,
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
