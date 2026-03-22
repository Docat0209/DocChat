import { FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { DocumentStatus } from '@/types/database'

interface ChatHeaderProps {
  documentName: string
  documentStatus: DocumentStatus
  children?: React.ReactNode
}

function StatusIndicator({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'processing':
    case 'uploading':
      return (
        <span className="flex items-center gap-1.5 text-xs text-yellow-500">
          <Loader2 className="size-3 animate-spin" />
          Processing
        </span>
      )
    case 'ready':
      return (
        <span className="flex items-center gap-1.5 text-xs text-green-500">
          <CheckCircle2 className="size-3" />
          Ready
        </span>
      )
    case 'failed':
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <XCircle className="size-3" />
          Failed
        </span>
      )
  }
}

export function ChatHeader({ documentName, documentStatus, children }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-medium text-foreground">{documentName}</h1>
      </div>
      <StatusIndicator status={documentStatus} />
      {children}
    </div>
  )
}
