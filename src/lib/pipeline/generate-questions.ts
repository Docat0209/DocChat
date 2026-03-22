import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

const MAX_CONTEXT_CHUNKS = 5

export async function generateSuggestedQuestions(
  chunks: Array<{ content: string; pageNumber: number }>,
  maxQuestions: number = 3,
): Promise<string[]> {
  const context = chunks
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map((c) => c.content)
    .join('\n\n')

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: `Based on the following document excerpt, generate exactly ${maxQuestions} specific questions a user might ask. Return ONLY a JSON array of strings, no other text.\n\nDocument:\n${context}`,
  })

  try {
    const questions = JSON.parse(text) as string[]
    if (!Array.isArray(questions)) return []
    return questions.filter((q): q is string => typeof q === 'string').slice(0, maxQuestions)
  } catch {
    return []
  }
}
