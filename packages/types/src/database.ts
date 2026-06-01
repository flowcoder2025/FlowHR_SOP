// 자동 생성 파일 — 직접 편집 금지.
// 생성: supabase gen types typescript (원격 staging nwcttwuvdnelfbpjeqzr, supabase MCP)
// 재생성: 스키마 변경 후 mcp__supabase__generate_typescript_types 결과를 본 파일로 갱신.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          label: string | null
          last_used_at: string | null
          owner_type: string
          reason: string | null
          revoked_at: string | null
          scopes: string[]
          tenant_id: string | null
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          label?: string | null
          last_used_at?: string | null
          owner_type?: string
          reason?: string | null
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string | null
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          label?: string | null
          last_used_at?: string | null
          owner_type?: string
          reason?: string | null
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string | null
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_lines: {
        Row: {
          conditions: Json
          created_at: string
          default_line: Json
          id: string
          is_active: boolean
          name: string
          request_type: Database["public"]["Enums"]["approval_request_type"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          default_line?: Json
          id?: string
          is_active?: boolean
          name: string
          request_type: Database["public"]["Enums"]["approval_request_type"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          default_line?: Json
          id?: string
          is_active?: boolean
          name?: string
          request_type?: Database["public"]["Enums"]["approval_request_type"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approval_id: string
          approver_id: string | null
          comment: string | null
          created_at: string
          id: string
          processed_at: string | null
          status: Database["public"]["Enums"]["approval_step_status"]
          step_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_id: string
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_order: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_id?: string
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: Database["public"]["Enums"]["approval_step_status"]
          step_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_approval_tenant_fk"
            columns: ["tenant_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "approval_steps_approver_tenant_fk"
            columns: ["tenant_id", "approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "approval_steps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          id: string
          request_object_id: string | null
          request_type: Database["public"]["Enums"]["approval_request_type"]
          requested_at: string | null
          requester_id: string
          sla_deadline: string | null
          status: Database["public"]["Enums"]["approval_status"]
          tenant_id: string
          title: string | null
          total_steps: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          request_object_id?: string | null
          request_type: Database["public"]["Enums"]["approval_request_type"]
          requested_at?: string | null
          requester_id: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tenant_id: string
          title?: string | null
          total_steps?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          id?: string
          request_object_id?: string | null
          request_type?: Database["public"]["Enums"]["approval_request_type"]
          requested_at?: string | null
          requester_id?: string
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          tenant_id?: string
          title?: string | null
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_requester_tenant_fk"
            columns: ["tenant_id", "requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "approvals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_modifications: {
        Row: {
          approval_id: string | null
          attachment_ids: string[]
          attendance_id: string | null
          created_at: string
          employee_id: string
          id: string
          original_value: string | null
          reason: string | null
          request_type: Database["public"]["Enums"]["modification_request_type"]
          requested_value: string | null
          status: Database["public"]["Enums"]["approval_status"]
          target_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          attachment_ids?: string[]
          attendance_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          original_value?: string | null
          reason?: string | null
          request_type: Database["public"]["Enums"]["modification_request_type"]
          requested_value?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          attachment_ids?: string[]
          attendance_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          original_value?: string | null
          reason?: string | null
          request_type?: Database["public"]["Enums"]["modification_request_type"]
          requested_value?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_modifications_approval_tenant_fk"
            columns: ["tenant_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "attendance_modifications_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_modifications_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "attendance_modifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          break_minutes: number
          clock_in_at: string | null
          clock_in_location: Json | null
          clock_out_at: string | null
          clock_out_location: Json | null
          created_at: string
          device_id: string | null
          employee_id: string
          id: string
          modification_reason: string | null
          modified_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          tenant_id: string
          updated_at: string
          work_date: string
          work_minutes: number | null
          work_type: Database["public"]["Enums"]["work_type"]
        }
        Insert: {
          break_minutes?: number
          clock_in_at?: string | null
          clock_in_location?: Json | null
          clock_out_at?: string | null
          clock_out_location?: Json | null
          created_at?: string
          device_id?: string | null
          employee_id: string
          id?: string
          modification_reason?: string | null
          modified_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          tenant_id: string
          updated_at?: string
          work_date: string
          work_minutes?: number | null
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Update: {
          break_minutes?: number
          clock_in_at?: string | null
          clock_in_location?: Json | null
          clock_out_at?: string | null
          clock_out_location?: Json | null
          created_at?: string
          device_id?: string | null
          employee_id?: string
          id?: string
          modification_reason?: string | null
          modified_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          tenant_id?: string
          updated_at?: string
          work_date?: string
          work_minutes?: number | null
          work_type?: Database["public"]["Enums"]["work_type"]
        }
        Relationships: [
          {
            foreignKeyName: "attendances_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "attendances_modified_by_tenant_fk"
            columns: ["tenant_id", "modified_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "attendances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          ip: string | null
          request_id: string | null
          result: Database["public"]["Enums"]["audit_result"]
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          request_id?: string | null
          result?: Database["public"]["Enums"]["audit_result"]
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          request_id?: string | null
          result?: Database["public"]["Enums"]["audit_result"]
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      backup_jobs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["backup_kind"]
          size_bytes: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"]
          storage_url: string | null
          triggered_by: string | null
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["backup_kind"]
          size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_url?: string | null
          triggered_by?: string | null
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["backup_kind"]
          size_bytes?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"]
          storage_url?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_backup_triggered_by"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          approval_id: string | null
          certificate_type: string | null
          copies: number
          created_at: string
          delivery_method: string | null
          employee_id: string
          id: string
          issued_at: string | null
          issued_document_id: string | null
          purpose: string | null
          request_memo: string | null
          status: Database["public"]["Enums"]["certificate_request_status"]
          submission_target: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          certificate_type?: string | null
          copies?: number
          created_at?: string
          delivery_method?: string | null
          employee_id: string
          id?: string
          issued_at?: string | null
          issued_document_id?: string | null
          purpose?: string | null
          request_memo?: string | null
          status?: Database["public"]["Enums"]["certificate_request_status"]
          submission_target?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          certificate_type?: string | null
          copies?: number
          created_at?: string
          delivery_method?: string | null
          employee_id?: string
          id?: string
          issued_at?: string | null
          issued_document_id?: string | null
          purpose?: string | null
          request_memo?: string | null
          status?: Database["public"]["Enums"]["certificate_request_status"]
          submission_target?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_approval_tenant_fk"
            columns: ["tenant_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "certificate_requests_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "certificate_requests_issued_document_id_fkey"
            columns: ["issued_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          head_employee_id: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          path_cache: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          path_cache?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          head_employee_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          path_cache?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_departments_head_employee"
            columns: ["head_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string
          id: string
          key: string
          label_ko: string | null
          template_body: string | null
          template_format: string | null
          tenant_id: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label_ko?: string | null
          template_body?: string | null
          template_format?: string | null
          tenant_id: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label_ko?: string | null
          template_body?: string | null
          template_format?: string | null
          tenant_id?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          owner_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          sub_type: Database["public"]["Enums"]["document_sub_type"]
          template_id: string | null
          tenant_id: string
          title: string | null
          updated_at: string
          viewed_at: string | null
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          owner_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          sub_type: Database["public"]["Enums"]["document_sub_type"]
          template_id?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          viewed_at?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          owner_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          sub_type?: Database["public"]["Enums"]["document_sub_type"]
          template_id?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          viewed_at?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_tenant_fk"
            columns: ["tenant_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_change_requests: {
        Row: {
          approval_id: string | null
          created_at: string
          employee_id: string
          field_name: string
          id: string
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          status: Database["public"]["Enums"]["change_request_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approval_id?: string | null
          created_at?: string
          employee_id: string
          field_name: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approval_id?: string | null
          created_at?: string
          employee_id?: string
          field_name?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_change_requests_approval_tenant_fk"
            columns: ["tenant_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "employee_change_requests_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "employee_change_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bank_account_encrypted: string | null
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          email: string | null
          emergency_contact: Json | null
          employee_number: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          family_info: Json | null
          id: string
          job_title: string | null
          joined_at: string | null
          left_at: string | null
          name: string
          phone: string | null
          position: string | null
          probation_ends_at: string | null
          role: string
          status: Database["public"]["Enums"]["employee_status"]
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          bank_account_encrypted?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_number?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          family_info?: Json | null
          id?: string
          job_title?: string | null
          joined_at?: string | null
          left_at?: string | null
          name: string
          phone?: string | null
          position?: string | null
          probation_ends_at?: string | null
          role?: string
          status?: Database["public"]["Enums"]["employee_status"]
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          bank_account_encrypted?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_number?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          family_info?: Json | null
          id?: string
          job_title?: string | null
          joined_at?: string | null
          left_at?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          probation_ends_at?: string | null
          role?: string
          status?: Database["public"]["Enums"]["employee_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          flag_key: string
          reason: string | null
          tenant_id: string
          value: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          flag_key: string
          reason?: string | null
          tenant_id: string
          value: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          flag_key?: string
          reason?: string | null
          tenant_id?: string
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_overrides_flag_key_fkey"
            columns: ["flag_key"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "feature_flag_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          applied_at: string | null
          created_at: string
          description: string | null
          global_state: Database["public"]["Enums"]["feature_flag_state"]
          is_beta: boolean
          key: string
          label_ko: string | null
          module: string | null
          plan_ids: string[]
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          description?: string | null
          global_state?: Database["public"]["Enums"]["feature_flag_state"]
          is_beta?: boolean
          key: string
          label_ko?: string | null
          module?: string | null
          plan_ids?: string[]
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          description?: string | null
          global_state?: Database["public"]["Enums"]["feature_flag_state"]
          is_beta?: boolean
          key?: string
          label_ko?: string | null
          module?: string | null
          plan_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          http_status: number | null
          id: string
          integration_id: string
          request_payload: Json | null
          response_payload: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          integration_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          integration_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          credentials_encrypted: Json | null
          failure_count_24h: number
          id: string
          last_synced_at: string | null
          status: Database["public"]["Enums"]["integration_status"]
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          credentials_encrypted?: Json | null
          failure_count_24h?: number
          id?: string
          last_synced_at?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          credentials_encrypted?: Json | null
          failure_count_24h?: number
          id?: string
          last_synced_at?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          employee_id: string | null
          expires_at: string
          id: string
          invited_by: string | null
          operator_flag: boolean
          status: Database["public"]["Enums"]["invitation_status"]
          target_role: string
          tenant_id: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          employee_id?: string | null
          expires_at: string
          id?: string
          invited_by?: string | null
          operator_flag?: boolean
          status?: Database["public"]["Enums"]["invitation_status"]
          target_role: string
          tenant_id?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          employee_id?: string | null
          expires_at?: string
          id?: string
          invited_by?: string | null
          operator_flag?: boolean
          status?: Database["public"]["Enums"]["invitation_status"]
          target_role?: string
          tenant_id?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_user_id_fkey"
            columns: ["accepted_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          active_users: number | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          paid_at: string | null
          payment_method: string | null
          period_month: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          subtotal_krw: number | null
          tax_invoice_id: string | null
          tax_krw: number | null
          tenant_id: string
          total_krw: number | null
          updated_at: string
        }
        Insert: {
          active_users?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_month?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal_krw?: number | null
          tax_invoice_id?: string | null
          tax_krw?: number | null
          tenant_id: string
          total_krw?: number | null
          updated_at?: string
        }
        Update: {
          active_users?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          paid_at?: string | null
          payment_method?: string | null
          period_month?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal_krw?: number | null
          tax_invoice_id?: string | null
          tax_krw?: number | null
          tenant_id?: string
          total_krw?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string
          employee_id: string
          expires_at: string | null
          granted: number
          id: string
          leave_type_id: string
          remaining: number | null
          scheduled: number
          tenant_id: string
          updated_at: string
          used: number
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          expires_at?: string | null
          granted?: number
          id?: string
          leave_type_id: string
          remaining?: number | null
          scheduled?: number
          tenant_id: string
          updated_at?: string
          used?: number
          year: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          expires_at?: string | null
          granted?: number
          id?: string
          leave_type_id?: string
          remaining?: number | null
          scheduled?: number
          tenant_id?: string
          updated_at?: string
          used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_tenant_fk"
            columns: ["tenant_id", "leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leave_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          carryover_allowed: boolean
          created_at: string
          default_days: number
          evidence_required: boolean
          id: string
          is_paid: boolean
          key: string
          label_ko: string | null
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          carryover_allowed?: boolean
          created_at?: string
          default_days?: number
          evidence_required?: boolean
          id?: string
          is_paid?: boolean
          key: string
          label_ko?: string | null
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          carryover_allowed?: boolean
          created_at?: string
          default_days?: number
          evidence_required?: boolean
          id?: string
          is_paid?: boolean
          key?: string
          label_ko?: string | null
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approval_id: string | null
          attachment_ids: string[]
          completed_at: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          half_day: Database["public"]["Enums"]["half_day"]
          id: string
          leave_type_id: string
          reason: string | null
          requested_at: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["leave_status"]
          substitute_employee_id: string | null
          tenant_id: string
          updated_at: string
          used_days: number
        }
        Insert: {
          approval_id?: string | null
          attachment_ids?: string[]
          completed_at?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          half_day?: Database["public"]["Enums"]["half_day"]
          id?: string
          leave_type_id: string
          reason?: string | null
          requested_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          substitute_employee_id?: string | null
          tenant_id: string
          updated_at?: string
          used_days?: number
        }
        Update: {
          approval_id?: string | null
          attachment_ids?: string[]
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          half_day?: Database["public"]["Enums"]["half_day"]
          id?: string
          leave_type_id?: string
          reason?: string | null
          requested_at?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          substitute_employee_id?: string | null
          tenant_id?: string
          updated_at?: string
          used_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaves_approval_tenant_fk"
            columns: ["tenant_id", "approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leaves_employee_tenant_fk"
            columns: ["tenant_id", "employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leaves_leave_type_tenant_fk"
            columns: ["tenant_id", "leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leaves_substitute_employee_tenant_fk"
            columns: ["tenant_id", "substitute_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "leaves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content_md: string | null
          created_at: string
          effective_date: string | null
          id: string
          is_active: boolean
          language: string
          published_at: string | null
          published_by: string | null
          summary_md: string | null
          title: string | null
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at: string
          version: string
        }
        Insert: {
          content_md?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean
          language: string
          published_at?: string | null
          published_by?: string | null
          summary_md?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string
          version: string
        }
        Update: {
          content_md?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean
          language?: string
          published_at?: string | null
          published_by?: string | null
          summary_md?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["legal_document_type"]
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_count: number
          email: string
          id: string
          ip: string
          locked_until: string | null
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempt_count?: number
          email: string
          id?: string
          ip: string
          locked_until?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempt_count?: number
          email?: string
          id?: string
          ip?: string
          locked_until?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      maintenance_windows: {
        Row: {
          activated_at: string | null
          created_by: string | null
          deactivated_at: string | null
          id: string
          message_ko: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
        }
        Insert: {
          activated_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          id?: string
          message_ko?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
        }
        Update: {
          activated_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          id?: string
          message_ko?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintenance_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          read_status: boolean
          tenant_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_status?: boolean
          tenant_id?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          read_status?: boolean
          tenant_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_users: {
        Row: {
          activated_at: string | null
          invited_at: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["operator_role"]
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          invited_at?: string | null
          is_active?: boolean
          role: Database["public"]["Enums"]["operator_role"]
          user_id: string
        }
        Update: {
          activated_at?: string | null
          invited_at?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["operator_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_operator_users_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_price_krw: number | null
          created_at: string
          id: string
          included_users: number | null
          is_public: boolean
          modules: string[]
          name: string
          per_user_price_krw: number | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          base_price_krw?: number | null
          created_at?: string
          id?: string
          included_users?: number | null
          is_public?: boolean
          modules?: string[]
          name: string
          per_user_price_krw?: number | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          base_price_krw?: number | null
          created_at?: string
          id?: string
          included_users?: number | null
          is_public?: boolean
          modules?: string[]
          name?: string
          per_user_price_krw?: number | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          default_permissions: Json
          is_system: boolean
          key: string
          label_ko: string | null
        }
        Insert: {
          default_permissions?: Json
          is_system?: boolean
          key: string
          label_ko?: string | null
        }
        Update: {
          default_permissions?: Json
          is_system?: boolean
          key?: string
          label_ko?: string | null
        }
        Relationships: []
      }
      scheduled_setting_changes: {
        Row: {
          applied_at: string | null
          apply_at: string
          attempt_count: number
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          payload: Json
          status: Database["public"]["Enums"]["scheduled_setting_change_status"]
          target: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          apply_at: string
          attempt_count?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["scheduled_setting_change_status"]
          target: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          apply_at?: string
          attempt_count?: number
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["scheduled_setting_change_status"]
          target?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_setting_changes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_setting_changes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string
          document_id: string
          evidence_payload: Json | null
          external_id: string | null
          external_provider: string | null
          id: string
          signature_image_url: string | null
          signed_at: string | null
          signer_employee_id: string | null
          signer_method: string | null
          status: Database["public"]["Enums"]["signature_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          evidence_payload?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          signature_image_url?: string | null
          signed_at?: string | null
          signer_employee_id?: string | null
          signer_method?: string | null
          status?: Database["public"]["Enums"]["signature_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          evidence_payload?: Json | null
          external_id?: string | null
          external_provider?: string | null
          id?: string
          signature_image_url?: string | null
          signed_at?: string | null
          signer_employee_id?: string | null
          signer_method?: string | null
          status?: Database["public"]["Enums"]["signature_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_signer_employee_tenant_fk"
            columns: ["tenant_id", "signer_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["tenant_id", "id"]
          },
          {
            foreignKeyName: "signatures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          id: string
          latched_base_price: number | null
          latched_price_per_user: number | null
          period_end: string | null
          period_start: string | null
          plan_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          latched_base_price?: number | null
          latched_price_per_user?: number | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          latched_base_price?: number | null
          latched_price_per_user?: number | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          brand_logo_url: string | null
          brand_logo_url_dark: string | null
          brand_name: string
          created_at: string
          data_retention: Json | null
          id: string
          mail_config: Json | null
          notification_channels: Json | null
          password_policy: Json | null
          require_operator_2fa: boolean
          session_policy: Json | null
          updated_at: string
        }
        Insert: {
          brand_logo_url?: string | null
          brand_logo_url_dark?: string | null
          brand_name?: string
          created_at?: string
          data_retention?: Json | null
          id?: string
          mail_config?: Json | null
          notification_channels?: Json | null
          password_policy?: Json | null
          require_operator_2fa?: boolean
          session_policy?: Json | null
          updated_at?: string
        }
        Update: {
          brand_logo_url?: string | null
          brand_logo_url_dark?: string | null
          brand_name?: string
          created_at?: string
          data_retention?: Json | null
          id?: string
          mail_config?: Json | null
          notification_channels?: Json | null
          password_policy?: Json | null
          require_operator_2fa?: boolean
          session_policy?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_drafts: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_step: number
          form_data: Json
          id: string
          status: Database["public"]["Enums"]["tenant_draft_status"]
          submitted_tenant_id: string | null
          updated_at: string
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          form_data?: Json
          id?: string
          status?: Database["public"]["Enums"]["tenant_draft_status"]
          submitted_tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          form_data?: Json
          id?: string
          status?: Database["public"]["Enums"]["tenant_draft_status"]
          submitted_tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_drafts_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_drafts_submitted_tenant_id_fkey"
            columns: ["submitted_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          company_info: Json | null
          created_at: string
          id: string
          notification_config: Json | null
          security_policy: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company_info?: Json | null
          created_at?: string
          id?: string
          notification_config?: Json | null
          security_policy?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          company_info?: Json | null
          created_at?: string
          id?: string
          notification_config?: Json | null
          security_policy?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active_user_count: number
          address: string | null
          admin_user_id: string | null
          business_number: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          deleted_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          metadata: Json
          name: string
          phone: string | null
          plan_id: string | null
          representative_name: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
          user_limit: number | null
        }
        Insert: {
          active_user_count?: number
          address?: string | null
          admin_user_id?: string | null
          business_number?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          metadata?: Json
          name: string
          phone?: string | null
          plan_id?: string | null
          representative_name?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_limit?: number | null
        }
        Update: {
          active_user_count?: number
          address?: string | null
          admin_user_id?: string | null
          business_number?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string
          phone?: string | null
          plan_id?: string | null
          representative_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
          user_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenants_admin_user"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachment_ids: string[]
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          attachment_ids?: string[]
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          attachment_ids?: string[]
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          requester_id: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tenant_id: string | null
          ticket_number: string
          title: string
          type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id?: string | null
          ticket_number: string
          title: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tenant_id?: string | null
          ticket_number?: string
          title?: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consented_at: string
          document_id: string
          document_type: string
          id: string
          ip_address: unknown
          source: Database["public"]["Enums"]["consent_source"]
          tenant_id: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consented_at?: string
          document_id: string
          document_type: string
          id?: string
          ip_address?: unknown
          source: Database["public"]["Enums"]["consent_source"]
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          consented_at?: string
          document_id?: string
          document_type?: string
          id?: string
          ip_address?: unknown
          source?: Database["public"]["Enums"]["consent_source"]
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          last_login_at: string | null
          last_login_ip: string | null
          locale: string
          recovery_codes_hash: string[] | null
          role: string | null
          tenant_id: string | null
          totp_enabled: boolean
          totp_secret_encrypted: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          locale?: string
          recovery_codes_hash?: string[] | null
          role?: string | null
          tenant_id?: string | null
          totp_enabled?: boolean
          totp_secret_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          locale?: string
          recovery_codes_hash?: string[] | null
          role?: string | null
          tenant_id?: string | null
          totp_enabled?: boolean
          totp_secret_encrypted?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_employee"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      work_policies: {
        Row: {
          applicable_departments: string[]
          applied_from: string | null
          break_minutes_default: number
          created_at: string
          id: string
          is_default: boolean
          late_threshold: string | null
          name: string
          standard_clock_in: string | null
          standard_clock_out: string | null
          tenant_id: string
          updated_at: string
          weekly_max_hours: number
        }
        Insert: {
          applicable_departments?: string[]
          applied_from?: string | null
          break_minutes_default?: number
          created_at?: string
          id?: string
          is_default?: boolean
          late_threshold?: string | null
          name: string
          standard_clock_in?: string | null
          standard_clock_out?: string | null
          tenant_id: string
          updated_at?: string
          weekly_max_hours?: number
        }
        Update: {
          applicable_departments?: string[]
          applied_from?: string | null
          break_minutes_default?: number
          created_at?: string
          id?: string
          is_default?: boolean
          late_threshold?: string | null
          name?: string
          standard_clock_in?: string | null
          standard_clock_out?: string | null
          tenant_id?: string
          updated_at?: string
          weekly_max_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "work_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { p_token_hash: string; p_user_id: string }
        Returns: {
          operator_flag: boolean
          target_role: string
          tenant_id: string
        }[]
      }
      claim_due_scheduled_setting_changes: {
        Args: { p_limit?: number }
        Returns: {
          applied_at: string | null
          apply_at: string
          attempt_count: number
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          payload: Json
          status: Database["public"]["Enums"]["scheduled_setting_change_status"]
          target: string
          tenant_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "scheduled_setting_changes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_employee_id: { Args: never; Returns: string }
      current_role_key: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      get_invitation_by_token_hash: {
        Args: { p_token_hash: string }
        Returns: {
          company_name: string
          email: string
          expires_at: string
          is_expired: boolean
          operator_flag: boolean
          status: Database["public"]["Enums"]["invitation_status"]
          target_role: string
          tenant_id: string
        }[]
      }
      is_approval_requester: {
        Args: { p_approval_id: string }
        Returns: boolean
      }
      is_approval_step_approver: {
        Args: { p_approval_id: string; p_only_pending?: boolean }
        Returns: boolean
      }
      is_operator: { Args: never; Returns: boolean }
      is_operator_super: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: never; Returns: boolean }
      my_team_employee_ids: { Args: never; Returns: string[] }
      prune_audit_logs: { Args: { p_retain?: string }; Returns: number }
      record_login_failure: {
        Args: { p_email: string; p_ip: string }
        Returns: {
          out_attempt_count: number
          out_locked_until: string
        }[]
      }
    }
    Enums: {
      approval_request_type:
        | "leave"
        | "attendance_mod"
        | "certificate"
        | "change_request"
        | "document"
      approval_status:
        | "draft"
        | "pending"
        | "in_progress"
        | "approved"
        | "rejected"
        | "cancelled"
      approval_step_status:
        | "pending"
        | "approved"
        | "rejected"
        | "skipped"
        | "delegated"
      attendance_status:
        | "normal"
        | "late"
        | "early_leave"
        | "absent"
        | "leave"
        | "remote"
        | "outside"
        | "business_trip"
        | "missing"
        | "modification_pending"
        | "modification_done"
      audit_result: "success" | "failed" | "denied"
      backup_kind: "auto" | "manual"
      backup_status: "pending" | "running" | "success" | "failed"
      billing_cycle: "monthly" | "annual"
      certificate_request_status:
        | "pending"
        | "in_progress"
        | "issued"
        | "rejected"
        | "cancelled"
      change_request_status: "pending" | "approved" | "rejected" | "cancelled"
      consent_source: "activate" | "forced" | "footer"
      document_status:
        | "draft"
        | "created"
        | "sent"
        | "viewed"
        | "acknowledged"
        | "expired"
      document_sub_type:
        | "payslip"
        | "contract"
        | "certificate"
        | "personal"
        | "company"
      document_visibility: "owner_only" | "owner_and_hr" | "company_wide"
      employee_status:
        | "invited"
        | "probation"
        | "active"
        | "on_leave"
        | "resigned"
        | "inactive"
      employment_type: "regular" | "contract" | "part_time" | "freelancer"
      feature_flag_state: "active" | "inactive" | "beta" | "restricted"
      half_day: "none" | "start" | "end"
      integration_status: "disconnected" | "connected" | "error" | "expired"
      invitation_status: "pending" | "accepted" | "revoked"
      invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "overdue"
        | "failed"
        | "refunded"
      leave_status:
        | "draft"
        | "pending"
        | "in_progress"
        | "approved"
        | "rejected"
        | "cancelled"
        | "completed"
      legal_document_type: "terms" | "privacy"
      maintenance_status: "inactive" | "scheduled" | "active"
      modification_request_type: "clock_in" | "clock_out" | "break" | "outside"
      notification_type: "approval" | "document" | "system" | "announcement"
      operator_role: "operator_super" | "operator_staff"
      plan_status: "active" | "inactive" | "sales_stopped" | "custom"
      scheduled_setting_change_status:
        | "pending"
        | "applying"
        | "applied"
        | "failed"
        | "cancelled"
      signature_status: "pending" | "signed" | "rejected" | "expired"
      tenant_draft_status: "draft" | "submitting" | "completed" | "abandoned"
      tenant_status:
        | "active"
        | "inactive"
        | "overdue"
        | "expiring_soon"
        | "expired"
        | "archived"
      ticket_priority: "p0" | "p1" | "p2" | "p3"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
      ticket_type: "inquiry" | "incident" | "request" | "other"
      work_type: "office" | "remote" | "outside" | "business_trip"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_request_type: [
        "leave",
        "attendance_mod",
        "certificate",
        "change_request",
        "document",
      ],
      approval_status: [
        "draft",
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "cancelled",
      ],
      approval_step_status: [
        "pending",
        "approved",
        "rejected",
        "skipped",
        "delegated",
      ],
      attendance_status: [
        "normal",
        "late",
        "early_leave",
        "absent",
        "leave",
        "remote",
        "outside",
        "business_trip",
        "missing",
        "modification_pending",
        "modification_done",
      ],
      audit_result: ["success", "failed", "denied"],
      backup_kind: ["auto", "manual"],
      backup_status: ["pending", "running", "success", "failed"],
      billing_cycle: ["monthly", "annual"],
      certificate_request_status: [
        "pending",
        "in_progress",
        "issued",
        "rejected",
        "cancelled",
      ],
      change_request_status: ["pending", "approved", "rejected", "cancelled"],
      consent_source: ["activate", "forced", "footer"],
      document_status: [
        "draft",
        "created",
        "sent",
        "viewed",
        "acknowledged",
        "expired",
      ],
      document_sub_type: [
        "payslip",
        "contract",
        "certificate",
        "personal",
        "company",
      ],
      document_visibility: ["owner_only", "owner_and_hr", "company_wide"],
      employee_status: [
        "invited",
        "probation",
        "active",
        "on_leave",
        "resigned",
        "inactive",
      ],
      employment_type: ["regular", "contract", "part_time", "freelancer"],
      feature_flag_state: ["active", "inactive", "beta", "restricted"],
      half_day: ["none", "start", "end"],
      integration_status: ["disconnected", "connected", "error", "expired"],
      invitation_status: ["pending", "accepted", "revoked"],
      invoice_status: [
        "draft",
        "issued",
        "paid",
        "overdue",
        "failed",
        "refunded",
      ],
      leave_status: [
        "draft",
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ],
      legal_document_type: ["terms", "privacy"],
      maintenance_status: ["inactive", "scheduled", "active"],
      modification_request_type: ["clock_in", "clock_out", "break", "outside"],
      notification_type: ["approval", "document", "system", "announcement"],
      operator_role: ["operator_super", "operator_staff"],
      plan_status: ["active", "inactive", "sales_stopped", "custom"],
      scheduled_setting_change_status: [
        "pending",
        "applying",
        "applied",
        "failed",
        "cancelled",
      ],
      signature_status: ["pending", "signed", "rejected", "expired"],
      tenant_draft_status: ["draft", "submitting", "completed", "abandoned"],
      tenant_status: [
        "active",
        "inactive",
        "overdue",
        "expiring_soon",
        "expired",
        "archived",
      ],
      ticket_priority: ["p0", "p1", "p2", "p3"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
      ticket_type: ["inquiry", "incident", "request", "other"],
      work_type: ["office", "remote", "outside", "business_trip"],
    },
  },
} as const
