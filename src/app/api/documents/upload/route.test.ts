import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockGetUsageStatus = vi.fn()
const mockExtractText = vi.fn()
const mockProcessDocument = vi.fn()
const mockGenerateSuggestedQuestions = vi.fn()

const mockStorageUpload = vi.fn()
const mockStorageRemove = vi.fn()
const mockStorageGetPublicUrl = vi.fn()
const mockInsert = vi.fn()
const mockUpdateEq = vi.fn()

vi.mock('@/lib/auth/get-user', () => ({
  getAuthenticatedUser: () => mockGetUser(),
}))

vi.mock('@/lib/usage/check-limits', () => ({
  getUsageStatus: (userId: string) => mockGetUsageStatus(userId),
}))

vi.mock('@/lib/extraction/extract-text', () => ({
  extractText: (buffer: Buffer, type: string) => mockExtractText(buffer, type),
}))

vi.mock('@/lib/pipeline/process-document', () => ({
  processDocument: (opts: unknown) => mockProcessDocument(opts),
}))

vi.mock('@/lib/pipeline/generate-questions', () => ({
  generateSuggestedQuestions: () => mockGenerateSuggestedQuestions(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockStorageUpload(...args),
        remove: (...args: unknown[]) => mockStorageRemove(...args),
        getPublicUrl: (...args: unknown[]) => mockStorageGetPublicUrl(...args),
      }),
    },
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
      update: () => ({
        eq: (...args: unknown[]) => mockUpdateEq(...args),
      }),
    }),
  }),
}))

const { POST } = await import('./route')

function makeMockFile(name: string, content: string, type: string, size?: number): File {
  const file = new File([content], name, { type })
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size })
  }
  return file
}

function makeRequest(file: File | null) {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown
}

describe('POST /api/documents/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue({ id: 'user-1' })
    mockGetUsageStatus.mockResolvedValue({ documents: { canUpload: true } })
    mockStorageUpload.mockResolvedValue({ error: null })
    mockStorageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/file.pdf' },
    })
    mockInsert.mockResolvedValue({ error: null })
    mockExtractText.mockResolvedValue({
      pages: [{ pageNumber: 1, content: 'Hello world' }],
      totalPages: 1,
      totalCharacters: 11,
    })
    mockProcessDocument.mockResolvedValue(undefined)
    mockGenerateSuggestedQuestions.mockResolvedValue([])
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce(null)
    const file = makeMockFile('test.txt', 'test', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(401)

    const body = await response.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 403 when document limit reached', async () => {
    mockGetUsageStatus.mockResolvedValueOnce({ documents: { canUpload: false } })
    const file = makeMockFile('test.txt', 'test', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(403)

    const body = await response.json()
    expect(body.code).toBe('DOCUMENT_LIMIT')
  })

  it('returns 400 when no file is provided', async () => {
    const response = await POST(makeRequest(null) as never)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.code).toBe('NO_FILE')
  })

  it('returns 415 for unsupported file types', async () => {
    const file = makeMockFile('test.csv', 'test', 'text/csv')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(415)

    const body = await response.json()
    expect(body.error).toContain('Unsupported')
  })

  it('uploads and processes a TXT file successfully', async () => {
    const file = makeMockFile('test.txt', 'Hello world', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.id).toBeDefined()
    expect(body.name).toBe('test.txt')
    expect(body.fileType).toBe('txt')
    expect(body.status).toBe('ready')
  })

  it('uploads and processes a PDF file successfully', async () => {
    const file = makeMockFile('report.pdf', 'fake pdf', 'application/pdf')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.id).toBeDefined()
    expect(body.name).toBe('report.pdf')
    expect(body.fileType).toBe('pdf')
    expect(body.status).toBe('ready')
  })

  it('uploads and processes a DOCX file successfully', async () => {
    const file = makeMockFile(
      'doc.docx',
      'fake docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.id).toBeDefined()
    expect(body.name).toBe('doc.docx')
    expect(body.fileType).toBe('docx')
    expect(body.status).toBe('ready')
  })

  it('returns response with id, name, fileType, and status fields', async () => {
    const file = makeMockFile('test.txt', 'content', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    const body = await response.json()

    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('name')
    expect(body).toHaveProperty('fileType')
    expect(body).toHaveProperty('status')
    expect(body.status).toBe('ready')
    expect(typeof body.id).toBe('string')
  })

  it('returns specific extraction error for PDF failures', async () => {
    mockExtractText.mockRejectedValueOnce(new Error('PDF parsing failed'))
    const file = makeMockFile('test.pdf', 'bad pdf', 'application/pdf')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toContain('Failed to extract text from PDF file')
    expect(body.error).toContain('PDF parsing failed')
    expect(body.code).toBe('EXTRACTION_ERROR')
  })

  it('returns chunk error when pipeline fails inserting chunks', async () => {
    mockProcessDocument.mockRejectedValueOnce(
      new Error('Failed to insert document chunks: DB error'),
    )
    const file = makeMockFile('test.txt', 'content', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    const body = await response.json()

    expect(body.status).toBe('failed')
    expect(body.error).toContain('Failed to store document chunks')
    expect(body.id).toBeDefined()
  })

  it('returns storage error when upload to storage fails', async () => {
    mockStorageUpload.mockResolvedValueOnce({ error: { message: 'Storage full' } })
    const file = makeMockFile('test.txt', 'content', 'text/plain')

    const response = await POST(makeRequest(file) as never)
    expect(response.status).toBe(500)

    const body = await response.json()
    expect(body.error).toBe('Failed to upload file to storage: Storage full')
    expect(body.code).toBe('STORAGE_ERROR')
  })
})
