import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageContent } from './message-content'

describe('MessageContent', () => {
  it('renders plain text without citations', () => {
    render(<MessageContent content="Hello world" role="assistant" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders user messages as plain text even with citation syntax', () => {
    render(<MessageContent content="What is on [Page 1]?" role="user" />)
    expect(screen.getByText('What is on [Page 1]?')).toBeInTheDocument()
  })

  it('renders [Page X] as Badge components for assistant messages', () => {
    render(<MessageContent content="According to [Page 3], the answer is yes." role="assistant" />)

    expect(screen.getByText('Page 3')).toBeInTheDocument()
    expect(screen.getByText(/According to/)).toBeInTheDocument()
    expect(screen.getByText(/, the answer is yes\./)).toBeInTheDocument()
  })

  it('handles multiple citations in one message', () => {
    render(<MessageContent content="See [Page 1] and [Page 5] for details." role="assistant" />)

    expect(screen.getByText('Page 1')).toBeInTheDocument()
    expect(screen.getByText('Page 5')).toBeInTheDocument()
  })
})
