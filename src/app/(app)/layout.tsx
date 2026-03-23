'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DocumentSidebar } from '@/components/sidebar/document-sidebar'
import { ErrorBoundary } from '@/components/error-boundary'
import { createClient } from '@/lib/supabase/client'
import type { Document, SubscriptionPlan } from '@/types/database'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [plan, setPlan] = useState<SubscriptionPlan | undefined>(undefined)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const previousDocumentsRef = useRef<Document[]>([])

  // Extract current document ID from path
  const currentDocumentId = pathname.startsWith('/chat/')
    ? pathname.split('/chat/')[1]?.split('/')[0]
    : undefined

  const fetchDocuments = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('documents')
      .select(
        'id, user_id, name, file_url, file_type, status, suggested_questions, created_at, updated_at',
      )
      .order('created_at', { ascending: false })

    if (data) {
      setDocuments(data as Document[])
    }
    setIsLoading(false)
  }, [])

  // Fetch documents and plan in parallel on mount
  useEffect(() => {
    const supabase = createClient()

    const fetchAll = async () => {
      const [docsResult, userResult] = await Promise.all([
        supabase
          .from('documents')
          .select(
            'id, user_id, name, file_url, file_type, status, suggested_questions, created_at, updated_at',
          )
          .order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ])

      if (docsResult.data) {
        setDocuments(docsResult.data as Document[])
      }
      setIsLoading(false)

      const user = userResult.data?.user
      if (!user) return
      setUserEmail(user.email ?? undefined)

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan as SubscriptionPlan)
      }
    }

    fetchAll()
  }, [])

  // Re-fetch documents when pathname changes (e.g., after upload navigates to new doc)
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments, pathname])

  // Detect document status transitions and show toasts
  useEffect(() => {
    const prev = previousDocumentsRef.current
    if (prev.length === 0) {
      previousDocumentsRef.current = documents
      return
    }

    for (const doc of documents) {
      const prevDoc = prev.find((d) => d.id === doc.id)
      if (!prevDoc) continue

      if (prevDoc.status !== 'ready' && doc.status === 'ready') {
        toast.success(`"${doc.name}" is ready for chat`)
      }
      if (prevDoc.status !== 'failed' && doc.status === 'failed') {
        toast.error(`"${doc.name}" failed to process`)
      }
    }

    previousDocumentsRef.current = documents
  }, [documents])

  // Poll for processing documents to update their status
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.status === 'processing' || d.status === 'uploading',
    )
    if (!hasProcessing) return

    const interval = setInterval(fetchDocuments, 3000)
    return () => clearInterval(interval)
  }, [documents, fetchDocuments])

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large. Maximum size is 20MB.')
        return
      }

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        const data = (await response.json()) as {
          id?: string
          status?: string
          error?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'Upload failed')
        }

        toast.success(`"${file.name}" uploaded successfully`)

        // Refresh list
        await fetchDocuments()

        // Navigate to the new document
        if (data.id) {
          router.push(`/chat/${data.id}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        toast.error(message)
      } finally {
        setIsUploading(false)
      }
    },
    [fetchDocuments, router],
  )

  const handleDelete = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Delete failed')
      }

      // Remove from local state immediately
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      toast.success('Document deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      toast.error(message)
    }
  }, [])

  return (
    <div className="flex h-screen">
      <DocumentSidebar
        documents={documents}
        currentDocumentId={currentDocumentId}
        onUpload={handleUpload}
        onDelete={handleDelete}
        isUploading={isUploading}
        isLoading={isLoading}
        plan={plan}
        userEmail={userEmail}
      />
      <main className="flex-1 overflow-hidden pt-12 md:pt-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  )
}
