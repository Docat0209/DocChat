import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { UIMessage } from 'ai'
import { ChatMessage } from './chat-message'

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="avatar" {...props}>
      {children}
    </div>
  ),
  AvatarFallback: ({ children }: React.PropsWithChildren) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}))

function createMessage(overrides: Partial<UIMessage> & { role: UIMessage['role'] }): UIMessage {
  return {
    id: 'msg-1',
    parts: [{ type: 'text' as const, text: 'Hello world' }],
    ...overrides,
  } as UIMessage
}

describe('ChatMessage', () => {
  it('renders user message right-aligned', () => {
    const message = createMessage({ role: 'user' })
    render(<ChatMessage message={message} />)

    const container = screen.getByTestId('message-user')
    expect(container).toHaveClass('flex-row-reverse')
  })

  it('renders assistant message left-aligned', () => {
    const message = createMessage({ role: 'assistant' })
    render(<ChatMessage message={message} />)

    const container = screen.getByTestId('message-assistant')
    expect(container).toHaveClass('flex-row')
    expect(container).not.toHaveClass('flex-row-reverse')
  })

  it('renders avatar for assistant messages only', () => {
    const assistantMsg = createMessage({ role: 'assistant' })
    const { unmount } = render(<ChatMessage message={assistantMsg} />)
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
    unmount()

    const userMsg = createMessage({ role: 'user' })
    render(<ChatMessage message={userMsg} />)
    expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()
  })

  it('renders citation badges for assistant messages with [Page X]', () => {
    const message = createMessage({
      role: 'assistant',
      parts: [{ type: 'text' as const, text: 'The answer is here [Page 5] and also [Page 12]' }],
    })
    render(<ChatMessage message={message} />)

    expect(screen.getByText('Page 5')).toBeInTheDocument()
    expect(screen.getByText('Page 12')).toBeInTheDocument()
  })

  it('shows streaming indicator when isStreaming is true', () => {
    const message = createMessage({ role: 'assistant' })
    const { container } = render(<ChatMessage message={message} isStreaming />)

    const pulsingDot = container.querySelector('.animate-pulse')
    expect(pulsingDot).toBeInTheDocument()
  })

  it('does not show streaming indicator when isStreaming is false', () => {
    const message = createMessage({ role: 'assistant' })
    const { container } = render(<ChatMessage message={message} />)

    const pulsingDot = container.querySelector('.animate-pulse')
    expect(pulsingDot).not.toBeInTheDocument()
  })
})
