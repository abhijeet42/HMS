// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentProfileView from '@/components/student/student-profile-view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentProfilePage() {
  const supabase = await createClient()

  // 1. Get current logged-in user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch student profile and room
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      rooms (*)
    `)
    .eq('user_id', user.id)
    .single()

  if (studentError || !student) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile Not Found</h1>
        <p className="text-gray-500 mt-2">Your student profile has not been set up by the admin yet.</p>
      </div>
    )
  }

  // 3. Fetch monthly bills
  const { data: bills } = await supabase
    .from('monthly_bills')
    .select('*')
    .eq('student_id', student.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  // 4. Fetch payments
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('student_id', student.id)
    .order('paid_at', { ascending: false })

  // 5. Fetch complaints
  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  // 6. Fetch notices
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manage your profile, bills, notices, and complaints</p>
      </div>

      <StudentProfileView
        student={student}
        bills={bills || []}
        payments={payments || []}
        complaints={complaints || []}
        notices={notices || []}
      />
    </div>
  )
}
