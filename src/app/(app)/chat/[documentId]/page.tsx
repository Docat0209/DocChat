'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/chat/chat-message'
import { ChatHeader } from '@/components/chat/chat-header'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { createClient } from '@/lib/supabase/client'
import type { DocumentStatus } from '@/types/database'

interface DocumentInfo {
  name: string
  status: DocumentStatus
}

export default function ChatPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null)

  useEffect(() => {
    async function fetchDocument() {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select('name, status')
        .eq('id', documentId)
        .single()
      if (data) {
        setDocumentInfo({ name: data.name, status: data.status as DocumentStatus })
      }
    }
    fetchDocument()
  }, [documentId])

  const transport = useMemo(() => new DefaultChatTransport({ body: { documentId } }), [documentId])

  const { messages, sendMessage, status, error } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'
  const isThinking = status === 'submitted'

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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

  const isProcessing = documentInfo?.status === 'processing' || documentInfo?.status === 'uploading'

  return (
    <div className="flex h-full flex-col bg-background">
      {documentInfo && (
        <ChatHeader documentName={documentInfo.name} documentStatus={documentInfo.status} />
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

          {!isProcessing && messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
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
            disabled={isLoading || isProcessing}
            className="min-h-10 resize-none rounded-xl"
            rows={1}
            aria-label="Chat message input"
          />
          <Button
            type="button"
            size="icon"
            disabled={isLoading || !input.trim() || isProcessing}
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
