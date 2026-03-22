import { describe, it, expect } from 'vitest'
import { OpenAIEmbeddings } from '@langchain/openai'

describe('OpenAI Embedding Integration', () => {
  const apiKey = process.env.OPENAI_API_KEY

  it.skipIf(!apiKey)(
    'generates embeddings for a query',
    async () => {
      const embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
      })
      const result = await embeddings.embedQuery('What is this document about?')
      expect(result).toHaveLength(1536)
      expect(typeof result[0]).toBe('number')
    },
    15000,
  )
})
