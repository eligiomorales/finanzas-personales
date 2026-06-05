export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type EmptyRelationships = []

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          email?: string
          display_name?: string | null
        }
        Relationships: EmptyRelationships
      }
      couples: {
        Row: {
          id: string
          invite_code: string
          invite_code_expires_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invite_code: string
          invite_code_expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          invite_code?: string
          invite_code_expires_at?: string | null
        }
        Relationships: EmptyRelationships
      }
      couple_members: {
        Row: {
          id: string
          couple_id: string
          user_id: string
          role: 'personA' | 'personB'
          joined_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          user_id: string
          role: 'personA' | 'personB'
          joined_at?: string
        }
        Update: {
          role?: 'personA' | 'personB'
        }
        Relationships: EmptyRelationships
      }
      categories: {
        Row: {
          id: string
          couple_id: string
          name: string
          type: 'income' | 'expense'
          color: string | null
        }
        Insert: {
          id?: string
          couple_id: string
          name: string
          type: 'income' | 'expense'
          color?: string | null
        }
        Update: {
          name?: string
          type?: 'income' | 'expense'
          color?: string | null
        }
        Relationships: EmptyRelationships
      }
      movements: {
        Row: {
          id: string
          couple_id: string
          type: 'income' | 'expense' | 'settlement'
          amount: number
          currency: 'ARS' | 'USD'
          date: string
          description: string
          category_id: string | null
          paid_by: 'personA' | 'personB' | 'both'
          share_person_a: number
          share_person_b: number
          is_shared: boolean
          source: 'manual' | 'imported'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          couple_id: string
          type: 'income' | 'expense' | 'settlement'
          amount: number
          currency: 'ARS' | 'USD'
          date: string
          description?: string
          category_id?: string | null
          paid_by: 'personA' | 'personB' | 'both'
          share_person_a?: number
          share_person_b?: number
          is_shared?: boolean
          source?: 'manual' | 'imported'
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: 'income' | 'expense' | 'settlement'
          amount?: number
          currency?: 'ARS' | 'USD'
          date?: string
          description?: string
          category_id?: string | null
          paid_by?: 'personA' | 'personB' | 'both'
          share_person_a?: number
          share_person_b?: number
          is_shared?: boolean
          source?: 'manual' | 'imported'
          updated_at?: string
        }
        Relationships: EmptyRelationships
      }
      couple_settings: {
        Row: {
          couple_id: string
          person_a_name: string
          person_b_name: string
          display_currency: 'ARS' | 'USD'
          default_exchange_rate_usd: number
        }
        Insert: {
          couple_id: string
          person_a_name?: string
          person_b_name?: string
          display_currency?: 'ARS' | 'USD'
          default_exchange_rate_usd?: number
        }
        Update: {
          person_a_name?: string
          person_b_name?: string
          display_currency?: 'ARS' | 'USD'
          default_exchange_rate_usd?: number
        }
        Relationships: EmptyRelationships
      }
      imports: {
        Row: {
          id: string
          couple_id: string
          account_type: 'credit' | 'debit'
          file_name: string
          imported_at: string
          detected_count: number
          confirmed_count: number
          status: 'pending' | 'completed' | 'cancelled'
        }
        Insert: {
          id?: string
          couple_id: string
          account_type: 'credit' | 'debit'
          file_name: string
          imported_at?: string
          detected_count?: number
          confirmed_count?: number
          status: 'pending' | 'completed' | 'cancelled'
        }
        Update: {
          detected_count?: number
          confirmed_count?: number
          status?: 'pending' | 'completed' | 'cancelled'
        }
        Relationships: EmptyRelationships
      }
      pending_import_movements: {
        Row: {
          id: string
          couple_id: string
          import_id: string
          date: string
          original_description: string
          amount: number
          currency: 'ARS' | 'USD'
          merchant: string | null
          suggested_category_id: string | null
          possible_duplicate: boolean
          duplicate_movement_id: string | null
          status: 'pending' | 'confirmed' | 'ignored'
        }
        Insert: {
          id?: string
          couple_id: string
          import_id: string
          date: string
          original_description: string
          amount: number
          currency: 'ARS' | 'USD'
          merchant?: string | null
          suggested_category_id?: string | null
          possible_duplicate?: boolean
          duplicate_movement_id?: string | null
          status: 'pending' | 'confirmed' | 'ignored'
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'ignored'
        }
        Relationships: EmptyRelationships
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_couple_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
