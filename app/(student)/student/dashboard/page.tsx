// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Bell, MapPin, MessageSquare, Calendar, Mail } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentDashboard() {
  const supabase = await createClient()

  // 1. Get current user
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
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile Not Found</h1>
        <p className="text-gray-500 mt-2">Your student profile has not been set up by the admin yet.</p>
      </div>
    )
  }

  // 3. Fetch latest active notice
  const { data: latestNotice } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 4. Fetch pending bills
  const { data: pendingBills } = await supabase
    .from('monthly_bills')
    .select('*')
    .eq('student_id', student.id)
    .in('status', ['pending', 'partial'])
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    
  const totalPendingAmount = (pendingBills || []).reduce((sum, b) => sum + ((b.total_amount || 0) - (b.amount_paid || 0)), 0)
  const upcomingBill = pendingBills && pendingBills.length > 0 ? pendingBills[0] : null

  // 5. Fetch recent complaints
  const { data: recentComplaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // 6. Fetch Hostel Contact Info
  const { data: hostelSettings } = await supabase
    .from('hostel_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {student.full_name} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">GL Hostel Resident Dashboard</p>
      </div>

      {/* Notice Alert (if exists) */}
      {latestNotice && (
        <div className={`rounded-xl p-4 border flex gap-4 items-start ${
          latestNotice.priority === 'urgent' ? 'bg-red-50/50 border-red-200' :
          latestNotice.priority === 'high' ? 'bg-orange-50/50 border-orange-200' :
          'bg-blue-50/50 border-blue-200'
        }`}>
          <div className={`p-2 rounded-full mt-0.5 ${
            latestNotice.priority === 'urgent' ? 'bg-red-100 text-red-600' :
            latestNotice.priority === 'high' ? 'bg-orange-100 text-orange-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`font-semibold ${
              latestNotice.priority === 'urgent' ? 'text-red-900' :
              latestNotice.priority === 'high' ? 'text-orange-900' :
              'text-blue-900'
            }`}>{latestNotice.title}</h3>
            <p className={`text-sm mt-1 leading-relaxed ${
              latestNotice.priority === 'urgent' ? 'text-red-700' :
              latestNotice.priority === 'high' ? 'text-orange-700' :
              'text-blue-700'
            }`}>{latestNotice.content}</p>
            <Link href="/student/notices" className={`text-xs font-semibold mt-2 inline-block hover:underline ${
              latestNotice.priority === 'urgent' ? 'text-red-800' :
              latestNotice.priority === 'high' ? 'text-orange-800' :
              'text-blue-800'
            }`}>
              View all notices →
            </Link>
          </div>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Room Info */}
        <Card className="p-5 border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">My Room Location</h2>
            </div>
            {student.rooms ? (
              <div className="mt-2">
                <p className="text-3xl font-bold text-gray-900">Room {student.rooms.room_number}</p>
                <p className="text-xs text-gray-500 mt-1">Floor {student.rooms.floor} • Base rent: {formatCurrency(student.rooms.monthly_rent)}/mo</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mt-2">No room currently assigned</p>
            )}
          </div>
        </Card>

        {/* Financial Info */}
        <Card className="p-5 border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Dues</h2>
            </div>
            <p className={`text-3xl font-bold mt-2 ${totalPendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalPendingAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {pendingBills?.length ? `${pendingBills.length} outstanding month(s)` : 'All rent payments are clear!'}
            </p>
          </div>
          <Link href="/student/rent" className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Pay dues & download bills →
          </Link>
        </Card>

        {/* Upcoming Due Date / Status */}
        <Card className="p-5 border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Upcoming Due</h2>
            </div>
            {upcomingBill ? (
              <div className="mt-2">
                <p className="text-lg font-bold text-gray-900">
                  Due on {upcomingBill.due_date ? new Date(upcomingBill.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                <p className="text-xs text-red-600 mt-1">Please clear before penalty charges apply.</p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  Paid Up to Date
                </p>
                <p className="text-xs text-gray-500 mt-1">Thank you for making timely payments.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Complaints */}
        <Card className="p-5 border-gray-200 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <div className="flex items-center gap-2 text-gray-500">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent Complaints</h2>
            </div>
            <Link href="/student/complaints" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Submit a Complaint
            </Link>
          </div>
          
          {(!recentComplaints || recentComplaints.length === 0) ? (
            <p className="text-sm text-gray-400 py-4 italic">No recent complaints registered.</p>
          ) : (
            <div className="space-y-4">
              {recentComplaints.map(c => (
                <div key={c.id} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-gray-900">{c.title}</p>
                    <p className="text-[10px] text-gray-400">Submitted on {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    c.status === 'resolved' ? 'bg-green-50 text-green-700 border border-green-200' :
                    c.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {c.status === 'resolved' ? 'Resolved' : c.status === 'in_progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Contact / Support Info */}
        <Card className="p-5 border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 mb-4 border-b pb-2">
              <Mail className="h-4 w-4 text-orange-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Hostel Office</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Office Phone</p>
                <p className="text-sm font-medium text-gray-900">{hostelSettings?.contact_number || '+91 98765 43210'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Office Email</p>
                <p className="text-sm font-medium text-gray-900">{hostelSettings?.email || 'support@glhostel.com'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Hostel Name</p>
                <p className="text-sm font-medium text-gray-900">{hostelSettings?.hostel_name || 'GL Hostel'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
