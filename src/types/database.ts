export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type MessageRole = 'user' | 'assistant'
export type SubscriptionPlan = 'free' | 'pro'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          stripe_customer_id: string | null
          plan: SubscriptionPlan
          question_count_today: number
          question_count_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          stripe_customer_id?: string | null
          plan?: SubscriptionPlan
          question_count_today?: number
          question_count_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          stripe_customer_id?: string | null
          plan?: SubscriptionPlan
          question_count_today?: number
          question_count_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          user_id: string
          name: string
          file_url: string
          file_type: string
          status: DocumentStatus
          suggested_questions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          file_url: string
          file_type: string
          status?: DocumentStatus
          suggested_questions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          file_url?: string
          file_type?: string
          status?: DocumentStatus
          suggested_questions?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      document_chunks: {
        Row: {
          id: string
          document_id: string
          content: string
          page_number: number
          chunk_index: number
          embedding: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          content: string
          page_number: number
          chunk_index: number
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          content?: string
          page_number?: number
          chunk_index?: number
          embedding?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'document_chunks_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
        ]
      }
      chats: {
        Row: {
          id: string
          document_id: string
          user_id: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          title?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chats_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'chats_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: MessageRole
          content: string
          sources: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: MessageRole
          content: string
          sources?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: MessageRole
          content?: string
          sources?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey'
            columns: ['chat_id']
            isOneToOne: false
            referencedRelation: 'chats'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type DocumentChunk = Database['public']['Tables']['document_chunks']['Row']
export type DocumentChunkInsert = Database['public']['Tables']['document_chunks']['Insert']
export type DocumentChunkUpdate = Database['public']['Tables']['document_chunks']['Update']

export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']
