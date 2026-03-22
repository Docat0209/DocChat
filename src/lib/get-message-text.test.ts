import { describe, it, expect } from 'vitest'
import type { UIMessage } from 'ai'
import { getMessageText } from './get-message-text'

function makeMessage(parts: UIMessage['parts']): UIMessage {
  return {
    id: 'msg-1',
    role: 'user',
    parts,
  } as UIMessage
}

describe('getMessageText', () => {
  it('extracts text from text parts', () => {
    const message = makeMessage([
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' },
    ])

    expect(getMessageText(message)).toBe('Hello world')
  })

  it('returns empty string for empty parts', () => {
    const message = makeMessage([])
    expect(getMessageText(message)).toBe('')
  })

  it('filters out non-text parts', () => {
    const message = makeMessage([
      { type: 'text', text: 'Hello' },
      { type: 'tool-invocation', toolInvocation: {} } as unknown as UIMessage['parts'][number],
      { type: 'text', text: ' world' },
    ])

    expect(getMessageText(message)).toBe('Hello world')
  })
})
