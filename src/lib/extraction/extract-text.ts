import { extractText as extractPdfText, getDocumentProxy } from 'unpdf'
import mammoth from 'mammoth'

export interface ExtractedPage {
  pageNumber: number
  content: string
}

export interface ExtractionResult {
  pages: ExtractedPage[]
  totalPages: number
  totalCharacters: number
}

const DOCX_CHUNK_SIZE = 3000

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractPdfText(pdf, { mergePages: false })

  const pages: ExtractedPage[] = (text as string[])
    .map((content, index) => ({
      pageNumber: index + 1,
      content: content.trim(),
    }))
    .filter((page) => page.content.length > 0)

  const totalCharacters = pages.reduce((sum, page) => sum + page.content.length, 0)

  return {
    pages,
    totalPages: pages.length,
    totalCharacters,
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer })
  const text = result.value

  if (!text.trim()) {
    return { pages: [], totalPages: 0, totalCharacters: 0 }
  }

  const pages: ExtractedPage[] = []
  let remaining = text
  let pageNumber = 1

  while (remaining.length > 0) {
    if (remaining.length <= DOCX_CHUNK_SIZE) {
      pages.push({ pageNumber, content: remaining.trim() })
      break
    }

    // Find a good break point near the chunk size (prefer paragraph breaks)
    let breakIndex = remaining.lastIndexOf('\n\n', DOCX_CHUNK_SIZE)
    if (breakIndex <= 0 || breakIndex < DOCX_CHUNK_SIZE * 0.5) {
      breakIndex = remaining.lastIndexOf('\n', DOCX_CHUNK_SIZE)
    }
    if (breakIndex <= 0 || breakIndex < DOCX_CHUNK_SIZE * 0.5) {
      breakIndex = remaining.lastIndexOf(' ', DOCX_CHUNK_SIZE)
    }
    if (breakIndex <= 0) {
      breakIndex = DOCX_CHUNK_SIZE
    }

    const chunk = remaining.slice(0, breakIndex).trim()
    if (chunk.length > 0) {
      pages.push({ pageNumber, content: chunk })
      pageNumber++
    }
    remaining = remaining.slice(breakIndex).trim()
  }

  const totalCharacters = pages.reduce((sum, page) => sum + page.content.length, 0)

  return {
    pages,
    totalPages: pages.length,
    totalCharacters,
  }
}

async function extractTxt(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8')

  if (!text.trim()) {
    return { pages: [], totalPages: 0, totalCharacters: 0 }
  }

  const sections = text.split(/\n\s*\n/)
  const pages: ExtractedPage[] = sections
    .map((content, index) => ({
      pageNumber: index + 1,
      content: content.trim(),
    }))
    .filter((page) => page.content.length > 0)

  const totalCharacters = pages.reduce((sum, page) => sum + page.content.length, 0)

  return {
    pages,
    totalPages: pages.length,
    totalCharacters,
  }
}

const SUPPORTED_TYPES: Record<string, (buffer: Buffer) => Promise<ExtractionResult>> = {
  'application/pdf': extractPdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractDocx,
  'text/plain': extractTxt,
}

export async function extractText(buffer: Buffer, fileType: string): Promise<ExtractionResult> {
  const extractor = SUPPORTED_TYPES[fileType]

  if (!extractor) {
    throw new Error(`Unsupported file type: ${fileType}`)
  }

  return extractor(buffer)
}
