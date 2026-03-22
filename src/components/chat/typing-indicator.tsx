export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2" aria-label="AI is thinking">
      <div className="flex gap-1">
        <span
          className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="size-2 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  )
}
