import { createClient } from '@/lib/supabase/server'
import ComplaintsClient from '@/components/admin/complaints-client'
import type { ComplaintWithStudent } from '@/types/database'

export default async function AdminComplaintsPage() {
  const supabase = await createClient()

  // Fetch complaints with student details
  const { data: complaints, error } = await supabase
    .from('complaints')
    .select(`
      *,
      students (full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching complaints:', error)
  }

  return <ComplaintsClient complaints={(complaints as ComplaintWithStudent[]) || []} />
}
