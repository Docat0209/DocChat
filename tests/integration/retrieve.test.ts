import { describe, it, expect } from 'vitest'
import { retrieveChunks } from '@/lib/rag/retrieve'
import { createAdminClient } from '@/lib/supabase/admin'

describe('RAG Retrieval Integration', () => {
  const apiKey = process.env.OPENAI_API_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  it.skipIf(!apiKey || !supabaseUrl || !serviceKey)(
    'retrieves relevant chunks for a query',
    async () => {
      const adminClient = createAdminClient()
      const { data: docs } = await adminClient
        .from('documents')
        .select('id')
        .eq('status', 'ready')
        .limit(1)

      if (!docs || docs.length === 0) {
        console.warn('Skipping — no ready documents in database')
        return
      }

      const chunks = await retrieveChunks('What is this about?', docs[0].id, 3)
      expect(Array.isArray(chunks)).toBe(true)

      if (chunks.length > 0) {
        expect(chunks[0]).toHaveProperty('content')
        expect(chunks[0]).toHaveProperty('pageNumber')
        expect(chunks[0]).toHaveProperty('chunkIndex')
        expect(chunks[0]).toHaveProperty('similarity')
        expect(typeof chunks[0].similarity).toBe('number')
      }
    },
    20000,
  )
})
