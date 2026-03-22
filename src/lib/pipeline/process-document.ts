import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { OpenAIEmbeddings } from '@langchain/openai'
import { Document } from '@langchain/core/documents'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExtractedPage } from '@/lib/extraction/extract-text'
import type { DocumentChunkInsert } from '@/types/database'

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_BATCH_SIZE = 100

interface ProcessDocumentOptions {
  documentId: string
  pages: ExtractedPage[]
}

export async function processDocument({
  documentId,
  pages,
}: ProcessDocumentOptions): Promise<void> {
  if (pages.length === 0) {
    return
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  })

  // Split each page into chunks with metadata
  const allChunks: Document[] = []
  let globalChunkIndex = 0

  for (const page of pages) {
    const docs = await splitter.createDocuments(
      [page.content],
      [
        {
          documentId,
          pageNumber: page.pageNumber,
        },
      ],
    )

    for (const doc of docs) {
      doc.metadata.chunkIndex = globalChunkIndex
      allChunks.push(doc)
      globalChunkIndex++
    }
  }

  if (allChunks.length === 0) {
    return
  }

  // Generate embeddings in batches
  const embeddings = new OpenAIEmbeddings({
    modelName: EMBEDDING_MODEL,
  })

  const allEmbeddings: number[][] = []

  for (let i = 0; i < allChunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBEDDING_BATCH_SIZE)
    const texts = batch.map((chunk) => chunk.pageContent)
    const batchEmbeddings = await embeddings.embedDocuments(texts)
    allEmbeddings.push(...batchEmbeddings)
  }

  // Build insert rows for document_chunks table
  const rows: DocumentChunkInsert[] = allChunks.map((chunk, index) => ({
    document_id: documentId,
    content: chunk.pageContent,
    page_number: chunk.metadata.pageNumber as number,
    chunk_index: chunk.metadata.chunkIndex as number,
    embedding: JSON.stringify(allEmbeddings[index]),
    metadata: {
      documentId,
      pageNumber: chunk.metadata.pageNumber as number,
      chunkIndex: chunk.metadata.chunkIndex as number,
    },
  }))

  // Insert in batches to avoid payload size limits
  const INSERT_BATCH_SIZE = 50
  const adminClient = createAdminClient()

  for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + INSERT_BATCH_SIZE)
    const { error } = await adminClient.from('document_chunks').insert(batch)

    if (error) {
      throw new Error(`Failed to insert document chunks: ${error.message}`)
    }
  }
}
