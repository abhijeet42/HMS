// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentRentClient from '@/components/student/student-rent-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentRentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/student/dashboard')

  // Fetch bills
  const { data: bills } = await supabase
    .from('monthly_bills')
    .select('*')
    .eq('student_id', student.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  // Fetch payments
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('student_id', student.id)
    .order('paid_at', { ascending: false })

  // Fetch Hostel Settings (for UPI ID)
  const { data: hostelSettings } = await supabase
    .from('hostel_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Rent & Bills</h1>
        <p className="text-sm text-gray-500">View your billing history and pay online</p>
      </div>

      <StudentRentClient
        bills={bills || []}
        payments={payments || []}
        studentName={student.full_name}
        upiId={hostelSettings?.upi_id || null}
        hostelName={hostelSettings?.hostel_name || 'GL Hostel'}
      />
    </div>
  )
}
