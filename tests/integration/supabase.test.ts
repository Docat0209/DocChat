import { describe, it, expect } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'

describe('Supabase Integration', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  it.skipIf(!supabaseUrl || !serviceKey)('connects to Supabase and queries profiles', async () => {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('profiles').select('id').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it.skipIf(!supabaseUrl || !serviceKey)('connects to Supabase and queries documents', async () => {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('documents').select('id, name, status').limit(5)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it.skipIf(!supabaseUrl || !serviceKey)(
    'match_documents RPC function exists and is callable',
    async () => {
      const adminClient = createAdminClient()
      const dummyEmbedding = JSON.stringify(Array(1536).fill(0.0))

      const { data, error } = await (
        adminClient.rpc as unknown as (
          fn: string,
          params: {
            query_embedding: string
            match_count: number
            filter_document_id: string | null
          },
        ) => Promise<{
          data: unknown[] | null
          error: { message: string } | null
        }>
      )('match_documents', {
        query_embedding: dummyEmbedding,
        match_count: 1,
        filter_document_id: null,
      })

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    },
    15000,
  )
})
