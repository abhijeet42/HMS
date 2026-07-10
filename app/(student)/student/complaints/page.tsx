// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentComplaintsClient from '@/components/student/student-complaints-client'
import type { Complaint } from '@/types/database'

export default async function StudentComplaintsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!student) redirect('/student/dashboard')

  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching complaints:', error)
  }

  return (
    <StudentComplaintsClient 
      complaints={(complaints as Complaint[]) || []} 
      studentId={student.id} 
    />
  )
}
