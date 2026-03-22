'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'error'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt']

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ext ? ACCEPTED_EXTENSIONS.includes(`.${ext}`) : false
}

export default function HomePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isAcceptedFile(file)) {
        setErrorMessage('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
        setStatus('error')
        return
      }

      setFileName(file.name)
      setStatus('uploading')
      setErrorMessage(null)

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
          details?: string
        }

        if (!response.ok) {
          throw new Error(data.error ?? 'Upload failed')
        }

        if (data.status === 'failed') {
          throw new Error(data.error ?? 'Document processing failed')
        }

        setStatus('processing')
        toast.success('Document uploaded successfully')

        if (data.id) {
          router.push(`/chat/${data.id}`)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setErrorMessage(message)
        setStatus('error')
        toast.error(message)
      }
    },
    [router],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    },
    [uploadFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const isUploading = status === 'uploading' || status === 'processing'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">DocChat</h1>
        <p className="mt-2 text-muted-foreground">Upload a document and start asking questions</p>
      </div>

      <Card className="w-full max-w-md p-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!isUploading) fileInputRef.current?.click()
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
          aria-label="Upload document"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />

          {status === 'idle' && (
            <>
              <Upload className="size-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or TXT (max 20MB)</p>
              </div>
            </>
          )}

          {status === 'uploading' && (
            <>
              <Loader2 className="size-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Uploading...</p>
                {fileName && <p className="mt-1 text-sm text-muted-foreground">{fileName}</p>}
              </div>
            </>
          )}

          {status === 'processing' && (
            <>
              <Loader2 className="size-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Processing document...</p>
                {fileName && <p className="mt-1 text-sm text-muted-foreground">{fileName}</p>}
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <FileText className="size-10 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-destructive">{errorMessage}</p>
                <p className="mt-1 text-sm text-muted-foreground">Click to try again</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {status === 'error' && (
        <Button
          variant="outline"
          onClick={() => {
            setStatus('idle')
            setErrorMessage(null)
            setFileName(null)
          }}
        >
          Reset
        </Button>
      )}
    </div>
  )
}
