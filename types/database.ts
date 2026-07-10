export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'student'
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'student'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'student'
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          room_number: string
          floor: number
          capacity: number
          occupied_beds: number
          monthly_rent: number
          status: 'available' | 'full' | 'maintenance'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_number: string
          floor?: number
          capacity?: number
          occupied_beds?: number
          monthly_rent: number
          status?: 'available' | 'full' | 'maintenance'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_number?: string
          floor?: number
          capacity?: number
          occupied_beds?: number
          monthly_rent?: number
          status?: 'available' | 'full' | 'maintenance'
          description?: string | null
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          room_id: string | null
          full_name: string
          email: string
          phone: string | null
          parent_phone: string | null
          college: string | null
          course: string | null
          joining_date: string
          checkout_date: string | null
          emergency_contact: string | null
          status: 'active' | 'inactive' | 'checked_out'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          room_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          parent_phone?: string | null
          college?: string | null
          course?: string | null
          joining_date: string
          checkout_date?: string | null
          emergency_contact?: string | null
          status?: 'active' | 'inactive' | 'checked_out'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          room_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          parent_phone?: string | null
          college?: string | null
          course?: string | null
          joining_date?: string
          checkout_date?: string | null
          emergency_contact?: string | null
          status?: 'active' | 'inactive' | 'checked_out'
          updated_at?: string
        }
      }
      monthly_bills: {
        Row: {
          id: string
          student_id: string
          room_id: string | null
          month: number
          year: number
          total_amount: number
          base_rent: number
          electricity: number
          water: number
          internet: number
          food: number
          cleaning: number
          laundry: number
          maintenance: number
          security_deposit: number
          previous_due: number
          discount: number
          adjustment: number
          other_charges: number
          late_fee: number
          other_label: string | null
          amount_paid: number
          status: 'pending' | 'partial' | 'paid'
          due_date: string | null
          paid_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          room_id?: string | null
          month: number
          year: number
          base_rent?: number
          electricity?: number
          water?: number
          internet?: number
          food?: number
          cleaning?: number
          laundry?: number
          maintenance?: number
          security_deposit?: number
          previous_due?: number
          discount?: number
          adjustment?: number
          other_charges?: number
          late_fee?: number
          other_label?: string | null
          amount_paid?: number
          status?: 'pending' | 'partial' | 'paid'
          due_date?: string | null
          paid_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          room_id?: string | null
          month?: number
          year?: number
          base_rent?: number
          electricity?: number
          water?: number
          internet?: number
          food?: number
          cleaning?: number
          laundry?: number
          maintenance?: number
          security_deposit?: number
          previous_due?: number
          discount?: number
          adjustment?: number
          other_charges?: number
          late_fee?: number
          other_label?: string | null
          amount_paid?: number
          status?: 'pending' | 'partial' | 'paid'
          due_date?: string | null
          paid_date?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          bill_id: string
          student_id: string
          amount: number
          payment_mode: 'cash' | 'upi' | 'bank_transfer' | 'other'
          transaction_ref: string | null
          collected_by: string | null
          notes: string | null
          paid_at: string
          created_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          student_id: string
          amount: number
          payment_mode?: 'cash' | 'upi' | 'bank_transfer' | 'other'
          transaction_ref?: string | null
          collected_by?: string | null
          notes?: string | null
          paid_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          student_id?: string
          amount?: number
          payment_mode?: 'cash' | 'upi' | 'bank_transfer' | 'other'
          transaction_ref?: string | null
          collected_by?: string | null
          notes?: string | null
          paid_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          title: string
          category: 'electricity' | 'water' | 'internet' | 'cleaning' | 'maintenance' | 'food' | 'furniture' | 'other'
          amount: number
          expense_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category: 'electricity' | 'water' | 'internet' | 'cleaning' | 'maintenance' | 'food' | 'furniture' | 'other'
          amount: number
          expense_date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: 'electricity' | 'water' | 'internet' | 'cleaning' | 'maintenance' | 'food' | 'furniture' | 'other'
          amount?: number
          expense_date?: string
          notes?: string | null
          updated_at?: string
        }
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'low' | 'normal' | 'high' | 'urgent'
          is_active: boolean
          published_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          is_active?: boolean
          published_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          is_active?: boolean
          published_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string
          category: 'fan' | 'light' | 'water' | 'internet' | 'cleaning' | 'furniture' | 'other'
          status: 'pending' | 'in_progress' | 'resolved'
          admin_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description: string
          category: 'fan' | 'light' | 'water' | 'internet' | 'cleaning' | 'furniture' | 'other'
          status?: 'pending' | 'in_progress' | 'resolved'
          admin_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string
          category?: 'fan' | 'light' | 'water' | 'internet' | 'cleaning' | 'furniture' | 'other'
          status?: 'pending' | 'in_progress' | 'resolved'
          admin_note?: string | null
          updated_at?: string
        }
      }
      hostel_settings: {
        Row: {
          id: string
          hostel_name: string
          address: string | null
          contact_number: string | null
          logo_url: string | null
          upi_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          hostel_name?: string
          address?: string | null
          contact_number?: string | null
          logo_url?: string | null
          upi_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          hostel_name?: string
          address?: string | null
          contact_number?: string | null
          logo_url?: string | null
          upi_id?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Room = Database['public']['Tables']['rooms']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type MonthlyBill = Database['public']['Tables']['monthly_bills']['Row']
export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Notice = Database['public']['Tables']['notices']['Row']
export type Complaint = Database['public']['Tables']['complaints']['Row']
export type HostelSettings = Database['public']['Tables']['hostel_settings']['Row']

// Extended types with joins
export type StudentWithRoom = Student & {
  rooms: Room | null
}

export type BillWithStudent = MonthlyBill & {
  students: Pick<Student, 'full_name' | 'email' | 'phone'> | null
  rooms: Pick<Room, 'room_number'> | null
}

export type ComplaintWithStudent = Complaint & {
  students: Pick<Student, 'full_name' | 'email'> | null
}
