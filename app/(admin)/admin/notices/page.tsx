import { createClient } from '@/lib/supabase/server'
import NoticesClient from '@/components/admin/notices-client'
import type { Notice } from '@/types/database'

export default async function AdminNoticesPage() {
  const supabase = await createClient()

  const { data: notices, error } = await supabase
    .from('notices')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching notices:', error)
  }

  return <NoticesClient notices={(notices as Notice[]) || []} />
}
