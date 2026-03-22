import { Fragment, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

interface MessageContentProps {
  content: string
  role: 'user' | 'assistant' | 'system' | 'data'
}

interface ContentPart {
  type: 'text' | 'citation'
  value: string
}

const PAGE_REFERENCE_PATTERN = /\[Page\s+(\d+)\]/g

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = []
  let lastIndex = 0

  for (const match of content.matchAll(PAGE_REFERENCE_PATTERN)) {
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, matchIndex) })
    }
    parts.push({ type: 'citation', value: `Page ${match[1]}` })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}

function MessageContent({ content, role }: MessageContentProps) {
  const parts = useMemo(() => parseContent(content), [content])

  if (role === 'user' || parts.length === 0) {
    return <p className="whitespace-pre-wrap text-sm">{content}</p>
  }

  return (
    <p className="whitespace-pre-wrap text-sm">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.type === 'text' ? (
            part.value
          ) : (
            <Badge variant="secondary" className="mx-0.5 inline-flex align-baseline text-xs">
              {part.value}
            </Badge>
          )}
        </Fragment>
      ))}
    </p>
  )
}

export { MessageContent }
