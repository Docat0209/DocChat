import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExtractedPage } from '@/lib/extraction/extract-text'

const mockInsert = vi.fn().mockReturnValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}))

vi.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: class MockOpenAIEmbeddings {
    async embedDocuments(texts: string[]) {
      return texts.map(() => Array.from({ length: 1536 }, () => Math.random()))
    }
  },
}))

const { processDocument } = await import('./process-document')

describe('processDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chunks pages and inserts them with correct metadata', async () => {
    const pages: ExtractedPage[] = [
      { pageNumber: 1, content: 'This is the content of page one. '.repeat(50) },
      { pageNumber: 2, content: 'Page two has different content. '.repeat(50) },
    ]

    await processDocument({ documentId: 'doc-123', pages })

    expect(mockFrom).toHaveBeenCalledWith('document_chunks')
    expect(mockInsert).toHaveBeenCalled()

    const insertedRows = mockInsert.mock.calls.flatMap(
      (call: unknown[]) =>
        call[0] as Array<{ document_id: string; page_number: number; chunk_index: number }>,
    )
    expect(insertedRows.length).toBeGreaterThan(0)

    for (const row of insertedRows) {
      expect(row.document_id).toBe('doc-123')
      expect(typeof row.page_number).toBe('number')
      expect(typeof row.chunk_index).toBe('number')
    }
  })

  it('returns early for empty pages array', async () => {
    await processDocument({ documentId: 'doc-empty', pages: [] })

    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('preserves sequential chunk indices across pages', async () => {
    const pages: ExtractedPage[] = [
      { pageNumber: 1, content: 'Short content on page one.' },
      { pageNumber: 2, content: 'Short content on page two.' },
    ]

    await processDocument({ documentId: 'doc-seq', pages })

    const insertedRows = mockInsert.mock.calls.flatMap(
      (call: unknown[]) => call[0] as Array<{ chunk_index: number }>,
    )
    const indices = insertedRows.map((r) => r.chunk_index)

    // Indices should be sequential starting from 0
    for (let i = 0; i < indices.length; i++) {
      expect(indices[i]).toBe(i)
    }
  })

  it('throws when supabase insert fails', async () => {
    mockInsert.mockReturnValueOnce({ error: { message: 'DB error' } })

    const pages: ExtractedPage[] = [
      { pageNumber: 1, content: 'Some content for testing error handling.' },
    ]

    await expect(processDocument({ documentId: 'doc-fail', pages })).rejects.toThrow(
      'Failed to insert document chunks: DB error',
    )
  })
})
