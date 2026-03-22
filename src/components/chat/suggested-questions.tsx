'use client'

import { Sparkles } from 'lucide-react'

interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        <span>Suggested questions</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
