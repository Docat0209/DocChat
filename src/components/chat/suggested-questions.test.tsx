import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SuggestedQuestions } from './suggested-questions'

describe('SuggestedQuestions', () => {
  const questions = ['What is the main topic?', 'How does it work?', 'What are the benefits?']

  it('renders clickable chips for each question', () => {
    render(<SuggestedQuestions questions={questions} onSelect={vi.fn()} />)

    for (const q of questions) {
      expect(screen.getByText(q)).toBeInTheDocument()
    }
  })

  it('calls onSelect with the question text when clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<SuggestedQuestions questions={questions} onSelect={onSelect} />)

    await user.click(screen.getByText('How does it work?'))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('How does it work?')
  })

  it('renders nothing when questions array is empty', () => {
    const { container } = render(<SuggestedQuestions questions={[]} onSelect={vi.fn()} />)

    expect(container.innerHTML).toBe('')
  })

  it('shows the "Suggested questions" label', () => {
    render(<SuggestedQuestions questions={questions} onSelect={vi.fn()} />)

    expect(screen.getByText('Suggested questions')).toBeInTheDocument()
  })
})
