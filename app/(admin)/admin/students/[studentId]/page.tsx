// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentProfileClient from '@/components/admin/student-profile-client'

interface PageProps {
  params: {
    studentId: string
  }
}

export default async function StudentDetailPage({ params }: PageProps) {
  // Await the params since Next.js 15+ params are async
  const { studentId } = await params
  
  const supabase = await createClient()

  // 1. Fetch student detail
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      rooms (
        id,
        room_number,
        floor,
        capacity,
        occupied_beds,
        monthly_rent,
        status,
        description
      )
    `)
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    console.error('Error fetching student:', studentError)
    redirect('/admin/students')
  }

  // 2. Fetch monthly bills for this student
  const { data: bills, error: billsError } = await supabase
    .from('monthly_bills')
    .select(`
      *,
      rooms (
        room_number
      )
    `)
    .eq('student_id', studentId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (billsError) {
    console.error('Error fetching bills:', billsError)
  }

  // 3. Fetch complaints for this student
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (complaintsError) {
    console.error('Error fetching complaints:', complaintsError)
  }

  // 4. Fetch rooms list (for generating new bill/room assign if needed)
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true })

  return (
    <StudentProfileClient
      student={student}
      bills={bills || []}
      complaints={complaints || []}
      rooms={rooms || []}
    />
  )
}
