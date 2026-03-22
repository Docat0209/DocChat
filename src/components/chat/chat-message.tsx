import { useMemo } from 'react'
import type { UIMessage } from 'ai'
import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageContent } from '@/components/message-content'
import { getMessageText } from '@/lib/get-message-text'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: UIMessage
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const text = useMemo(() => getMessageText(message), [message])

  return (
    <div
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
      data-testid={`message-${message.role}`}
    >
      {!isUser && (
        <Avatar size="sm" className="mt-0.5 shrink-0">
          <AvatarFallback>
            <Bot className="size-3.5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-muted text-foreground',
          )}
        >
          <MessageContent content={text} role={message.role} />
          {isStreaming && (
            <span className="ml-1 inline-block size-1.5 animate-pulse rounded-full bg-current opacity-70" />
          )}
        </div>
      </div>
    </div>
  )
}
