import { describe, it, expect } from 'vitest'
import { extractText } from '@/lib/extraction/extract-text'
import fs from 'fs'
import path from 'path'

describe('Text Extraction (Integration)', () => {
  it('extracts text from a real TXT file', async () => {
    const buffer = fs.readFileSync(path.join(__dirname, '../fixtures/sample.txt'))
    const result = await extractText(buffer as unknown as Buffer, 'text/plain')
    expect(result.pages.length).toBeGreaterThan(0)
    expect(result.totalCharacters).toBeGreaterThan(0)
    expect(result.pages[0].content).toBeTruthy()
  })

  it('extracts text from a real PDF file', async () => {
    const pdfPath = path.join(__dirname, '../fixtures/sample.pdf')
    if (!fs.existsSync(pdfPath)) {
      console.warn('Skipping PDF test — sample.pdf not found')
      return
    }
    const buffer = fs.readFileSync(pdfPath)
    const result = await extractText(buffer as unknown as Buffer, 'application/pdf')
    expect(result.pages.length).toBeGreaterThan(0)
  })

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('test')
    await expect(extractText(buffer, 'application/csv')).rejects.toThrow('Unsupported file type')
  })

  it('handles empty TXT file', async () => {
    const buffer = Buffer.from('')
    const result = await extractText(buffer, 'text/plain')
    expect(result.pages.length).toBe(0)
    expect(result.totalCharacters).toBe(0)
  })
})
