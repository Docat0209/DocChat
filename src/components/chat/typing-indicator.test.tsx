import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TypingIndicator } from './typing-indicator'

describe('TypingIndicator', () => {
  it('renders 3 animated dots', () => {
    const { container } = render(<TypingIndicator />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('has accessible label', () => {
    render(<TypingIndicator />)

    expect(screen.getByLabelText('AI is thinking')).toBeInTheDocument()
  })

  it('applies staggered animation delays', () => {
    const { container } = render(<TypingIndicator />)

    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots[0]).toHaveStyle({ animationDelay: '0ms' })
    expect(dots[1]).toHaveStyle({ animationDelay: '150ms' })
    expect(dots[2]).toHaveStyle({ animationDelay: '300ms' })
  })
})
