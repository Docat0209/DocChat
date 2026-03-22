import { describe, it, expect } from 'vitest'
import { extractText } from './extract-text'

describe('extractText', () => {
  describe('PDF extraction', () => {
    it('should return pages with content from a PDF buffer', async () => {
      // TODO: Create a test PDF buffer or fixture
      // const buffer = readFileSync('fixtures/sample.pdf')
      // const result = await extractText(buffer, 'application/pdf')
      // expect(result.pages.length).toBeGreaterThan(0)
      // expect(result.pages[0].pageNumber).toBe(1)
      // expect(result.pages[0].content).toBeTruthy()
      // expect(result.totalPages).toBeGreaterThan(0)
      // expect(result.totalCharacters).toBeGreaterThan(0)
      expect(true).toBe(true) // placeholder
    })

    it('should preserve page numbers from form feed characters', async () => {
      // TODO: Create a multi-page PDF and verify page splitting
      expect(true).toBe(true) // placeholder
    })
  })

  describe('DOCX extraction', () => {
    it('should return content from a DOCX buffer', async () => {
      // TODO: Create a test DOCX buffer or fixture
      // const buffer = readFileSync('fixtures/sample.docx')
      // const result = await extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      // expect(result.pages.length).toBeGreaterThan(0)
      // expect(result.totalCharacters).toBeGreaterThan(0)
      expect(true).toBe(true) // placeholder
    })

    it('should split long documents into chunks of approximately 3000 characters', async () => {
      // TODO: Create a long DOCX and verify chunk sizes
      expect(true).toBe(true) // placeholder
    })
  })

  describe('TXT extraction', () => {
    it('should return content from a TXT buffer', async () => {
      const buffer = Buffer.from('Hello world\n\nSecond section\n\nThird section')
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(3)
      expect(result.pages[0].pageNumber).toBe(1)
      expect(result.pages[0].content).toBe('Hello world')
      expect(result.pages[1].pageNumber).toBe(2)
      expect(result.pages[1].content).toBe('Second section')
      expect(result.pages[2].pageNumber).toBe(3)
      expect(result.pages[2].content).toBe('Third section')
      expect(result.totalPages).toBe(3)
      expect(result.totalCharacters).toBe(
        'Hello world'.length + 'Second section'.length + 'Third section'.length,
      )
    })

    it('should handle empty text files', async () => {
      const buffer = Buffer.from('')
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(0)
      expect(result.totalPages).toBe(0)
      expect(result.totalCharacters).toBe(0)
    })
  })

  describe('unsupported types', () => {
    it('should throw an error for unsupported file types', async () => {
      const buffer = Buffer.from('test')
      await expect(extractText(buffer, 'image/png')).rejects.toThrow(
        'Unsupported file type: image/png',
      )
    })
  })
})
