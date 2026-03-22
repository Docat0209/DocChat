import { OpenAIEmbeddings } from '@langchain/openai'
import { createAdminClient } from '@/lib/supabase/admin'

const EMBEDDING_MODEL = 'text-embedding-3-small'

export interface RetrievedChunk {
  content: string
  pageNumber: number
  chunkIndex: number
  similarity: number
}

interface MatchDocumentRow {
  content: string
  page_number: number
  chunk_index: number
  similarity: number
}

export async function retrieveChunks(
  query: string,
  documentId: string,
  topK: number = 5,
): Promise<RetrievedChunk[]> {
  const embeddings = new OpenAIEmbeddings({
    modelName: EMBEDDING_MODEL,
  })

  const queryEmbedding = await embeddings.embedQuery(query)

  const adminClient = createAdminClient()

  // The RPC function is not typed in Database['public']['Functions'],
  // so we cast through unknown to call it with the correct parameters.
  const { data, error } = await (
    adminClient.rpc as unknown as (
      fn: string,
      params: {
        query_embedding: string
        match_count: number
        filter_document_id: string
      },
    ) => Promise<{ data: MatchDocumentRow[] | null; error: { message: string } | null }>
  )('match_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: topK,
    filter_document_id: documentId,
  })

  if (error) {
    throw new Error(`Failed to retrieve chunks: ${error.message}`)
  }

  if (!data) {
    return []
  }

  return data.map((row) => ({
    content: row.content,
    pageNumber: row.page_number,
    chunkIndex: row.chunk_index,
    similarity: row.similarity,
  }))
}
