'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { DocumentSidebar } from '@/components/sidebar/document-sidebar'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/database'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

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

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

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

        // Refresh list
        await fetchDocuments()

        // Navigate to the new document
        if (data.id) {
          router.push(`/chat/${data.id}`)
        }
      } catch (err) {
        console.error('Upload error:', err)
      } finally {
        setIsUploading(false)
      }
    },
    [fetchDocuments, router],
  )

  const handleDelete = useCallback(async (documentId: string) => {
    const response = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = (await response.json()) as { error?: string }
      throw new Error(data.error ?? 'Delete failed')
    }

    // Remove from local state immediately
    setDocuments((prev) => prev.filter((d) => d.id !== documentId))
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
      />
      <main className="flex-1 overflow-hidden pt-12 md:pt-0">{children}</main>
    </div>
  )
}
