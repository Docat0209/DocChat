import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSuggestedQuestions } from './generate-questions'

const mockGenerateText = vi.fn()

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mock-model'),
}))

const sampleChunks = [
  { content: 'Chapter 1: Introduction to machine learning concepts.', pageNumber: 1 },
  { content: 'Supervised learning uses labeled data to train models.', pageNumber: 2 },
  { content: 'Neural networks are inspired by biological neurons.', pageNumber: 3 },
]

describe('generateSuggestedQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an array of questions from a valid JSON response', async () => {
    const questions = [
      'What is machine learning?',
      'How does supervised learning work?',
      'What are neural networks?',
    ]
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(questions) })

    const result = await generateSuggestedQuestions(sampleChunks)

    expect(result).toEqual(questions)
    expect(mockGenerateText).toHaveBeenCalledOnce()
  })

  it('limits results to maxQuestions', async () => {
    const questions = ['Question 1?', 'Question 2?', 'Question 3?', 'Question 4?', 'Question 5?']
    mockGenerateText.mockResolvedValue({ text: JSON.stringify(questions) })

    const result = await generateSuggestedQuestions(sampleChunks, 2)

    expect(result).toHaveLength(2)
    expect(result).toEqual(['Question 1?', 'Question 2?'])
  })

  it('returns empty array when response is not valid JSON', async () => {
    mockGenerateText.mockResolvedValue({ text: 'Here are some questions for you:' })

    const result = await generateSuggestedQuestions(sampleChunks)

    expect(result).toEqual([])
  })

  it('returns empty array when response is valid JSON but not an array', async () => {
    mockGenerateText.mockResolvedValue({ text: '{"question": "What?"}' })

    const result = await generateSuggestedQuestions(sampleChunks)

    expect(result).toEqual([])
  })

  it('filters out non-string entries from the array', async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify(['Valid question?', 42, null, 'Another question?']),
    })

    const result = await generateSuggestedQuestions(sampleChunks)

    expect(result).toEqual(['Valid question?', 'Another question?'])
  })

  it('uses at most 5 chunks for context', async () => {
    const manyChunks = Array.from({ length: 10 }, (_, i) => ({
      content: `Chunk ${i + 1} content`,
      pageNumber: i + 1,
    }))
    mockGenerateText.mockResolvedValue({ text: '["Question?"]' })

    await generateSuggestedQuestions(manyChunks)

    const callArg = mockGenerateText.mock.calls[0][0] as { prompt: string }
    expect(callArg.prompt).toContain('Chunk 5 content')
    expect(callArg.prompt).not.toContain('Chunk 6 content')
  })
})
