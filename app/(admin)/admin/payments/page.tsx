// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import PaymentsClient from '@/components/admin/payments-client'
import type { BillWithStudent, StudentWithRoom, PaymentTransaction } from '@/types/database'
import { CURRENT_MONTH, CURRENT_YEAR } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // 1. Fetch bills (default to current year to avoid loading everything, client can filter)
  const { data: bills, error: billsError } = await supabase
    .from('monthly_bills')
    .select(`
      *,
      students (full_name, email),
      rooms (room_number)
    `)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (billsError) console.error('Error fetching bills:', billsError)

  // 2. Fetch all students for the "Generate Bill" dropdown
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      *,
      rooms (*)
    `)
    .order('full_name', { ascending: true })

  if (studentsError) console.error('Error fetching students:', studentsError)

  // 3. Fetch recent payment transactions
  const { data: transactions, error: txError } = await supabase
    .from('payment_transactions')
    .select('*')
    .order('paid_at', { ascending: false })

  if (txError) console.error('Error fetching transactions:', txError)

  return (
    <PaymentsClient 
      bills={(bills as BillWithStudent[]) || []}
      students={(students as StudentWithRoom[]) || []}
      transactions={(transactions as PaymentTransaction[]) || []}
    />
  )
}
