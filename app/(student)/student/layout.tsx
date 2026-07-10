// @ts-nocheck
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/student/student-sidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify auth and role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') {
    redirect('/admin/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col lg:flex-row">
      <StudentSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0">
        {/* Top padding for mobile sticky header */}
        <div className="lg:hidden h-14" />
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
