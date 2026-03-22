'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Loader2, MessageSquare, Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat/chat-message'
import { ChatHeader } from '@/components/chat/chat-header'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { SuggestedQuestions } from '@/components/chat/suggested-questions'
import { createClient } from '@/lib/supabase/client'
import type { DocumentStatus, Message } from '@/types/database'

interface DocumentInfo {
  name: string
  status: DocumentStatus
  suggestedQuestions: string[]
}

function messagesToUIMessages(messages: Message[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    parts: [{ type: 'text' as const, text: m.content }],
    createdAt: new Date(m.created_at),
  }))
}

export default function ChatPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const hasSyncedChatId = useRef(false)

  useEffect(() => {
    async function fetchDocument() {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select('name, status, suggested_questions')
        .eq('id', documentId)
        .single()
      if (data) {
        const raw = data.suggested_questions
        const suggestedQuestions = Array.isArray(raw)
          ? raw.filter((q): q is string => typeof q === 'string')
          : []
        setDocumentInfo({
          name: data.name,
          status: data.status as DocumentStatus,
          suggestedQuestions,
        })
      }
    }
    fetchDocument()
  }, [documentId])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: { documentId },
      }),
    [documentId],
  )

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId ?? undefined,
    transport,
  })

  // Load chat history when chatId changes
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      hasSyncedChatId.current = false
      return
    }

    async function loadMessages() {
      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`)
        if (response.ok) {
          const data = (await response.json()) as Message[]
          setMessages(messagesToUIMessages(data))
        }
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadMessages()
    hasSyncedChatId.current = true
  }, [chatId, setMessages])

  const isLoading = status === 'submitted' || status === 'streaming'
  const isThinking = status === 'submitted'

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // After first message response, update URL with chatId from response headers
  useEffect(() => {
    if (hasSyncedChatId.current || chatId) return
    // When we have messages and streaming just finished, check for chatId
    if (messages.length >= 2 && status === 'ready') {
      // The chat API returns x-chat-id header, but we can't access response headers
      // from useChat directly. Instead, we'll extract chatId from the transport response.
      // For now, we fetch the latest chat for this document.
      async function syncChatId() {
        const response = await fetch(`/api/chats?documentId=${documentId}`)
        if (response.ok) {
          const chats = (await response.json()) as Array<{ id: string }>
          if (chats.length > 0) {
            hasSyncedChatId.current = true
            router.replace(`/chat/${documentId}?chat=${chats[0].id}`, { scroll: false })
          }
        }
      }
      syncChatId()
    }
  }, [messages.length, status, chatId, documentId, router])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput('')
    sendMessage({ text: trimmed })
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleSelectQuestion = useCallback(
    (question: string) => {
      if (isLoading) return
      setInput('')
      sendMessage({ text: question })
    },
    [isLoading, sendMessage],
  )

  const handleNewChat = useCallback(() => {
    router.push(`/chat/${documentId}`)
  }, [router, documentId])

  const isProcessing = documentInfo?.status === 'processing' || documentInfo?.status === 'uploading'

  return (
    <div className="flex h-full flex-col bg-background">
      {documentInfo && (
        <ChatHeader documentName={documentInfo.name} documentStatus={documentInfo.status}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleNewChat}
            aria-label="Start new chat"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </ChatHeader>
      )}

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          {isProcessing && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Processing document...</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This may take a moment. You can chat once processing is complete.
                </p>
              </div>
            </div>
          )}

          {isLoadingHistory && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading conversation...</p>
            </div>
          )}

          {!isProcessing && !isLoadingHistory && messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Ask a question about your document
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your answers will include page references.
                  </p>
                </div>
              </div>
              {documentInfo?.suggestedQuestions &&
                documentInfo.suggestedQuestions.length > 0 && (
                  <SuggestedQuestions
                    questions={documentInfo.suggestedQuestions}
                    onSelect={handleSelectQuestion}
                  />
                )}
            </div>
          )}

          {messages.map((message, index) => {
            const isLastAssistant =
              message.role === 'assistant' &&
              index === messages.length - 1 &&
              status === 'streaming'
            return <ChatMessage key={message.id} message={message} isStreaming={isLastAssistant} />
          })}

          {isThinking && (
            <div className="flex gap-3">
              <div className="rounded-2xl bg-muted">
                <TypingIndicator />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            disabled={isLoading || isProcessing || isLoadingHistory}
            className="min-h-10 resize-none rounded-xl"
            rows={1}
            aria-label="Chat message input"
          />
          <Button
            type="button"
            size="icon"
            disabled={isLoading || !input.trim() || isProcessing || isLoadingHistory}
            onClick={handleSend}
            aria-label="Send message"
            className="shrink-0 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
