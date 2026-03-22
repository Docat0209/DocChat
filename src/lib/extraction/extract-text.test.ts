import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { extractText } from './extract-text'

vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(async () => ({})),
  extractText: vi.fn(async () => ({
    totalPages: 3,
    text: ['Page one content', 'Page two content', ''],
  })),
}))

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({
      value: 'First section of the document.\n\nSecond section with more details.',
    })),
  },
}))

describe('extractText', () => {
  describe('TXT extraction', () => {
    it('splits text by double newlines into pages', async () => {
      const buffer = Buffer.from('Hello world\n\nSecond section\n\nThird section')
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(3)
      expect(result.pages[0]).toEqual({ pageNumber: 1, content: 'Hello world' })
      expect(result.pages[1]).toEqual({ pageNumber: 2, content: 'Second section' })
      expect(result.pages[2]).toEqual({ pageNumber: 3, content: 'Third section' })
      expect(result.totalPages).toBe(3)
      expect(result.totalCharacters).toBe(
        'Hello world'.length + 'Second section'.length + 'Third section'.length,
      )
    })

    it('reads from a real fixture file', async () => {
      const fixturePath = path.resolve(__dirname, '../../../tests/fixtures/sample.txt')
      const buffer = readFileSync(fixturePath)
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(3)
      expect(result.totalPages).toBe(3)
      expect(result.totalCharacters).toBeGreaterThan(0)
      expect(result.pages[0].content).toContain('first paragraph')
    })

    it('handles empty text files', async () => {
      const buffer = Buffer.from('')
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(0)
      expect(result.totalPages).toBe(0)
      expect(result.totalCharacters).toBe(0)
    })

    it('handles whitespace-only content', async () => {
      const buffer = Buffer.from('   \n\n   \n\n   ')
      const result = await extractText(buffer, 'text/plain')

      expect(result.pages).toHaveLength(0)
      expect(result.totalPages).toBe(0)
    })
  })

  describe('PDF extraction', () => {
    it('returns pages from unpdf and filters empty pages', async () => {
      const buffer = Buffer.from('fake pdf content')
      const result = await extractText(buffer, 'application/pdf')

      expect(result.pages).toHaveLength(2)
      expect(result.pages[0]).toEqual({ pageNumber: 1, content: 'Page one content' })
      expect(result.pages[1]).toEqual({ pageNumber: 2, content: 'Page two content' })
      expect(result.totalPages).toBe(2)
      expect(result.totalCharacters).toBe('Page one content'.length + 'Page two content'.length)
    })
  })

  describe('DOCX extraction', () => {
    it('returns chunked text from mammoth', async () => {
      const buffer = Buffer.from('fake docx content')
      const result = await extractText(
        buffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )

      expect(result.pages.length).toBeGreaterThan(0)
      expect(result.totalCharacters).toBeGreaterThan(0)
      expect(result.pages[0].pageNumber).toBe(1)
    })
  })

  describe('unsupported types', () => {
    it('throws for unsupported file types', async () => {
      const buffer = Buffer.from('test')
      await expect(extractText(buffer, 'text/csv')).rejects.toThrow(
        'Unsupported file type: text/csv',
      )
    })

    it('throws for image types', async () => {
      const buffer = Buffer.from('test')
      await expect(extractText(buffer, 'image/png')).rejects.toThrow(
        'Unsupported file type: image/png',
      )
    })
  })
})
