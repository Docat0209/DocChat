import { describe, it, expect } from 'vitest'
import { extractText } from '@/lib/extraction/extract-text'
import fs from 'fs'
import path from 'path'

const FIXTURES = path.join(__dirname, '../fixtures')

describe('Text Extraction - All File Types (Integration)', () => {
  it('extracts text from a real TXT file with multiple sections', async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES, 'test-document.txt'))
    const result = await extractText(buffer, 'text/plain')
    expect(result.pages.length).toBeGreaterThanOrEqual(4) // 4 sections
    expect(result.totalCharacters).toBeGreaterThan(500)
    const allText = result.pages.map((p) => p.content).join(' ')
    expect(allText).toContain('Code Quality')
  })

  it('extracts text from a real PDF file with multiple pages', async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES, 'test-document.pdf'))
    const result = await extractText(buffer, 'application/pdf')
    expect(result.pages.length).toBeGreaterThanOrEqual(2) // At least 2 pages
    expect(result.totalCharacters).toBeGreaterThan(200)
    // Verify content from page 1
    const allText = result.pages.map((p) => p.content).join(' ')
    expect(allText.toLowerCase()).toContain('artificial intelligence')
  })

  it('extracts text from a real DOCX file with chapters', async () => {
    const buffer = fs.readFileSync(path.join(FIXTURES, 'test-document.docx'))
    const result = await extractText(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    expect(result.pages.length).toBeGreaterThanOrEqual(1)
    expect(result.totalCharacters).toBeGreaterThan(200)
    const allText = result.pages.map((p) => p.content).join(' ')
    expect(allText.toLowerCase()).toContain('climate change')
  })

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('test content')
    await expect(extractText(buffer, 'application/csv')).rejects.toThrow('Unsupported file type')
  })

  it('handles empty TXT file gracefully', async () => {
    const buffer = Buffer.from('')
    const result = await extractText(buffer, 'text/plain')
    expect(result.pages.length).toBe(0)
    expect(result.totalCharacters).toBe(0)
  })
})
