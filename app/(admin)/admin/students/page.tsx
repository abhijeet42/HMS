import { createClient } from '@/lib/supabase/server'
import StudentsClient from '@/components/admin/students-client'
import type { StudentWithRoom, Room } from '@/types/database'

export default async function AdminStudentsPage() {
  const supabase = await createClient()

  // Fetch students with their room details
  const { data: students, error: studentsError } = await supabase
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
        description,
        created_at,
        updated_at
      )
    `)
    .order('created_at', { ascending: false })

  if (studentsError) {
    console.error('Error fetching students:', studentsError)
  }

  // Fetch rooms for assignment dropdown
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true })

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
  }

  return (
    <StudentsClient 
      students={(students as StudentWithRoom[]) || []} 
      rooms={(rooms as Room[]) || []} 
    />
  )
}
