// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import RoomsClient from '@/components/admin/rooms-client'
import type { Room } from '@/types/database'

export default async function AdminRoomsPage() {
  const supabase = await createClient()

  // Fetch rooms ordered by room_number
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true })

  if (error) {
    console.error('Error fetching rooms:', error)
  }

  // Fetch students who are active and have room assigned
  const { data: students, error: stdError } = await supabase
    .from('students')
    .select('id, full_name, room_id')
    .eq('status', 'active')
    .not('room_id', 'is', null)

  if (stdError) {
    console.error('Error fetching students for rooms:', stdError)
  }

  return (
    <RoomsClient
      rooms={(rooms as Room[]) || []}
      students={students || []}
    />
  )
}
