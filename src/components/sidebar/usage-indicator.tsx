'use client'

import { useEffect, useState } from 'react'
import { Crown, FileText, MessageSquare } from 'lucide-react'
import type { UsageStatus } from '@/lib/usage/check-limits'

function ProgressBar({ current, limit }: { current: number; limit: number }) {
  const percentage = limit === Infinity ? 0 : Math.min((current / limit) * 100, 100)
  const isAtLimit = current >= limit && limit !== Infinity

  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${
          isAtLimit ? 'bg-destructive' : 'bg-primary'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function formatLimit(current: number, limit: number): string {
  if (limit === Infinity) return `${current}`
  return `${current}/${limit}`
}

export function UsageIndicator() {
  const [usage, setUsage] = useState<UsageStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchUsage() {
      try {
        const response = await fetch('/api/usage')
        if (response.ok && !cancelled) {
          const data = (await response.json()) as UsageStatus
          setUsage(data)
        }
      } catch {
        // Silently fail — indicator is non-critical
      }
    }
    fetchUsage()
    return () => {
      cancelled = true
    }
  }, [])

  if (!usage) return null

  if (usage.plan === 'pro') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Crown className="size-3.5 text-yellow-500" />
        <span className="font-medium">Pro Plan</span>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 rounded-md bg-muted/50 px-3 py-2.5">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="size-3" />
            Documents
          </span>
          <span>{formatLimit(usage.documents.current, usage.documents.limit)}</span>
        </div>
        <ProgressBar current={usage.documents.current} limit={usage.documents.limit} />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-3" />
            Questions today
          </span>
          <span>{formatLimit(usage.questions.current, usage.questions.limit)}</span>
        </div>
        <ProgressBar current={usage.questions.current} limit={usage.questions.limit} />
      </div>
    </div>
  )
}
