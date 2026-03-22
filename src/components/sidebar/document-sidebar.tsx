'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FileText,
  FileType2,
  File,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Menu,
  Upload,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LogoutButton } from '@/components/logout-button'
import { formatRelativeDate } from '@/lib/format-relative-date'
import { cn } from '@/lib/utils'
import type { Document } from '@/types/database'

interface ChatSummary {
  id: string
  title: string | null
  created_at: string
}

interface DocumentSidebarProps {
  documents: Document[]
  currentDocumentId?: string
  onUpload: (file: File) => Promise<void>
  onDelete: (documentId: string) => Promise<void>
  isUploading: boolean
  isLoading: boolean
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt'

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf':
      return <FileText className="size-4 shrink-0 text-red-400" />
    case 'docx':
      return <FileType2 className="size-4 shrink-0 text-blue-400" />
    case 'txt':
      return <File className="size-4 shrink-0 text-zinc-400" />
    default:
      return <FileText className="size-4 shrink-0 text-muted-foreground" />
  }
}

function getStatusIcon(status: Document['status']) {
  switch (status) {
    case 'processing':
    case 'uploading':
      return <Loader2 className="size-3.5 shrink-0 animate-spin text-yellow-500" />
    case 'ready':
      return <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
    case 'failed':
      return <XCircle className="size-3.5 shrink-0 text-destructive" />
  }
}

function ChatListItem({
  chat,
  isActive,
  onSelect,
}: {
  chat: ChatSummary
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
        'hover:bg-accent/50 cursor-pointer ml-5',
        isActive && 'bg-accent/70 text-accent-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{chat.title ?? 'Untitled chat'}</span>
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
        {formatRelativeDate(chat.created_at)}
      </span>
    </div>
  )
}

function DocumentListItem({
  doc,
  isActive,
  isExpanded,
  onSelect,
  onToggleExpand,
  onDeleteClick,
  chats,
  currentChatId,
  onChatSelect,
}: {
  doc: Document
  isActive: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onDeleteClick: () => void
  chats: ChatSummary[]
  currentChatId: string | null
  onChatSelect: (chatId: string) => void
}) {
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-accent/50 cursor-pointer',
          isActive && 'bg-accent text-accent-foreground',
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {chats.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="shrink-0 rounded p-0.5 hover:bg-accent"
            aria-label={isExpanded ? 'Collapse chats' : 'Expand chats'}
          >
            <ChevronRight
              className={cn(
                'size-3 text-muted-foreground transition-transform',
                isExpanded && 'rotate-90',
              )}
            />
          </button>
        )}
        {chats.length === 0 && <div className="w-4 shrink-0" />}
        {getFileIcon(doc.file_type)}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{doc.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {getStatusIcon(doc.status)}
            <span>{formatRelativeDate(doc.created_at)}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                onClick={(e) => e.stopPropagation()}
                aria-label="Document options"
              />
            }
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClick()
              }}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chat list under document */}
      {isExpanded && chats.length > 0 && (
        <div className="space-y-0.5 py-1">
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={currentChatId === chat.id}
              onSelect={() => onChatSelect(chat.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarContent({
  documents,
  currentDocumentId,
  onUpload,
  onDelete,
  isUploading,
  isLoading,
  onNavigate,
}: DocumentSidebarProps & { onNavigate?: () => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentChatId = searchParams.get('chat')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [chatsByDocument, setChatsByDocument] = useState<Record<string, ChatSummary[]>>({})

  // Auto-expand the current document
  useEffect(() => {
    if (currentDocumentId) {
      setExpandedDocs((prev) => {
        if (prev.has(currentDocumentId)) return prev
        const next = new Set(prev)
        next.add(currentDocumentId)
        return next
      })
    }
  }, [currentDocumentId])

  // Fetch chats for expanded documents
  useEffect(() => {
    for (const docId of expandedDocs) {
      fetchChatsForDocument(docId)
    }
  }, [expandedDocs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh chats when currentChatId changes (new chat created)
  useEffect(() => {
    if (currentDocumentId && currentChatId) {
      fetchChatsForDocument(currentDocumentId)
    }
  }, [currentChatId, currentDocumentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChatsForDocument = useCallback(async (documentId: string) => {
    const response = await fetch(`/api/chats?documentId=${documentId}`)
    if (response.ok) {
      const chats = (await response.json()) as ChatSummary[]
      setChatsByDocument((prev) => ({ ...prev, [documentId]: chats }))
    }
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onUpload(file)
        e.target.value = ''
      }
    },
    [onUpload],
  )

  const handleDocumentSelect = useCallback(
    (documentId: string) => {
      router.push(`/chat/${documentId}`)
      onNavigate?.()
    },
    [router, onNavigate],
  )

  const handleChatSelect = useCallback(
    (documentId: string, chatId: string) => {
      router.push(`/chat/${documentId}?chat=${chatId}`)
      onNavigate?.()
    },
    [router, onNavigate],
  )

  const handleToggleExpand = useCallback((documentId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) {
        next.delete(documentId)
      } else {
        next.add(documentId)
      }
      return next
    })
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget)
      if (deleteTarget === currentDocumentId) {
        router.push('/')
      }
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, onDelete, currentDocumentId, router])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">DocChat</h2>
        <LogoutButton />
      </div>

      {/* Upload button */}
      <div className="p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <Button
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              New Document
            </>
          )}
        </Button>
      </div>

      {/* Document list */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="size-4 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <Upload className="size-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Upload your first document to get started
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Plus className="size-3.5" />
              Upload document
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {documents.map((doc) => (
              <DocumentListItem
                key={doc.id}
                doc={doc}
                isActive={doc.id === currentDocumentId}
                isExpanded={expandedDocs.has(doc.id)}
                onSelect={() => handleDocumentSelect(doc.id)}
                onToggleExpand={() => handleToggleExpand(doc.id)}
                onDeleteClick={() => setDeleteTarget(doc.id)}
                chats={chatsByDocument[doc.id] ?? []}
                currentChatId={currentChatId}
                onChatSelect={(chatId) => handleChatSelect(doc.id, chatId)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will delete the document and all conversations. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function DocumentSidebar(props: DocumentSidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Suspense>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[280px] shrink-0 border-r bg-background md:block">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile hamburger + sheet */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center border-b bg-background px-3 py-2 md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open sidebar" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Document sidebar</SheetTitle>
            </SheetHeader>
            <SidebarContent {...props} onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="ml-2 text-lg font-semibold">DocChat</span>
      </div>
    </Suspense>
  )
}
