/**
 * Tipos TypeScript gerados a partir do schema do Supabase
 * Estes tipos garantem type-safety em todo o código
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          document: string | null
          email: string | null
          phone: string | null
          logo_url: string | null
          settings: Json
          subscription_plan: string
          subscription_status: string
          subscription_expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string
          language: string
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      company_users: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          permissions: Json
          is_active: boolean
          invited_by: string | null
          invited_at: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['company_users']['Row'], 'id' | 'joined_at' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['company_users']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          document: string | null
          status: string
          source: string | null
          score: number
          custom_fields: Json
          notes: string | null
          tags: string[]
          ai_enabled: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          last_interaction_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          company_id: string
          contact_id: string
          channel: string
          channel_thread_id: string | null
          status: string
          priority: string
          subject: string | null
          assigned_to: string | null
          ai_assistant_enabled: boolean
          opened_at: string
          closed_at: string | null
          last_message_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'opened_at' | 'last_message_at' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          company_id: string
          conversation_id: string
          contact_id: string
          content: string
          content_type: string
          media_url: string | null
          sender_type: string
          sender_id: string | null
          ai_agent_id: string | null
          channel_message_id: string | null
          channel_timestamp: string | null
          direction: string
          status: string
          read_at: string | null
          ai_context: Json | null
          ai_prompt_version_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      ai_prompts: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          version: number
          parent_id: string | null
          prompt_text: string
          system_prompt: string | null
          model: string
          temperature: number
          max_tokens: number
          context_type: string | null
          channel: string | null
          allowed_actions: Json
          forbidden_actions: Json
          constraints: string | null
          is_active: boolean
          is_default: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_prompts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ai_prompts']['Insert']>
      }
      ai_logs: {
        Row: {
          id: string
          company_id: string
          conversation_id: string | null
          contact_id: string | null
          message_id: string | null
          ai_agent_id: string | null
          prompt_id: string | null
          prompt_version: number | null
          input_context: Json
          user_message: string | null
          ai_response: string
          ai_metadata: Json | null
          decisions: Json | null
          confidence_score: number | null
          status: string
          error_message: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ai_logs']['Insert']>
      }
      automations: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          n8n_workflow_id: string | null
          n8n_webhook_url: string | null
          trigger_event: string
          trigger_conditions: Json
          is_active: boolean
          is_paused: boolean
          last_executed_at: string | null
          execution_count: number
          error_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['automations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['automations']['Insert']>
      }
      automation_logs: {
        Row: {
          id: string
          company_id: string
          automation_id: string
          trigger_event: string
          trigger_data: Json | null
          n8n_execution_id: string | null
          status: string
          execution_time_ms: number | null
          result_data: Json | null
          error_message: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['automation_logs']['Row'], 'id' | 'started_at' | 'created_at'>
        Update: Partial<Database['public']['Tables']['automation_logs']['Insert']>
      }
      files: {
        Row: {
          id: string
          company_id: string
          name: string
          original_name: string
          description: string | null
          storage_path: string
          storage_bucket: string
          file_url: string
          file_size: number
          mime_type: string | null
          file_type: string | null
          category: string | null
          tags: string[]
          is_knowledge_base: boolean
          is_public: boolean
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['files']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['files']['Insert']>
      }
      payments: {
        Row: {
          id: string
          company_id: string
          contact_id: string | null
          amount: number
          currency: string
          description: string | null
          status: string
          payment_method: string | null
          payment_gateway: string | null
          external_id: string | null
          due_date: string | null
          paid_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          actor_type: string
          actor_name: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      contact_custom_fields: {
        Row: {
          id: string
          company_id: string
          field_key: string
          field_label: string
          field_type: string
          field_options: Json | null
          is_required: boolean
          is_active: boolean
          display_order: number
          validation_rules: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contact_custom_fields']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contact_custom_fields']['Insert']>
      }
      channel_integrations: {
        Row: {
          id: string
          company_id: string
          channel: string
          channel_name: string | null
          status: string
          connection_data: Json
          n8n_instance_id: string | null
          n8n_webhook_url: string | null
          n8n_qr_code_url: string | null
          qr_code_base64: string | null
          connected_at: string | null
          disconnected_at: string | null
          last_sync_at: string | null
          total_messages: number
          total_conversations: number
          auto_reply_enabled: boolean
          business_hours_only: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['channel_integrations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['channel_integrations']['Insert']>
      }
    }
  }
}

// Tipos auxiliares para uso no código
export type Company = Database['public']['Tables']['companies']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type CompanyUser = Database['public']['Tables']['company_users']['Row']
export type CompanyUserInsert = Database['public']['Tables']['company_users']['Insert']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type AIPrompt = Database['public']['Tables']['ai_prompts']['Row']
export type AILog = Database['public']['Tables']['ai_logs']['Row']
export type Automation = Database['public']['Tables']['automations']['Row']
export type AutomationLog = Database['public']['Tables']['automation_logs']['Row']
export type File = Database['public']['Tables']['files']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type ContactCustomField = Database['public']['Tables']['contact_custom_fields']['Row']
export type ChannelIntegration = Database['public']['Tables']['channel_integrations']['Row']

// Tipos para inserção
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type AIPromptInsert = Database['public']['Tables']['ai_prompts']['Insert']
export type AutomationInsert = Database['public']['Tables']['automations']['Insert']

// Enums úteis
export enum ContactStatus {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  CLIENT = 'client',
  INACTIVE = 'inactive',
}

export enum ConversationStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  TRANSFERRED = 'transferred',
  WAITING = 'waiting',
}

export enum MessageSenderType {
  HUMAN = 'human',
  AI = 'ai',
  SYSTEM = 'system',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  OBSERVER = 'observer',
}

export enum ActorType {
  HUMAN = 'human',
  AI = 'ai',
  SYSTEM = 'system',
}

