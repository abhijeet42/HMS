import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getMonthName, CURRENT_MONTH, CURRENT_YEAR } from '@/lib/utils'
import {
  Users,
  DoorOpen,
  BedDouble,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MessageSquare,
  Bell,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch all dashboard data in parallel
  const [
    { count: totalStudents },
    { count: totalRooms },
    { data: rooms },
    { data: currentMonthBills },
    { data: currentMonthExpenses },
    { data: recentBills },
    { data: recentComplaints },
    { data: recentNotices },
    { data: profile },
    { count: joinedThisMonth },
    { count: leavingSoon },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('capacity, occupied_beds, status'),
    supabase.from('monthly_bills').select('total_amount, amount_paid, status').eq('month', CURRENT_MONTH).eq('year', CURRENT_YEAR),
    supabase.from('expenses').select('amount').gte('expense_date', `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-01`).lte('expense_date', `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-31`),
    supabase.from('monthly_bills').select('id, month, year, total_amount, amount_paid, status, students(full_name, email), rooms(room_number)').order('created_at', { ascending: false }).limit(5),
    supabase.from('complaints').select('id, title, category, status, created_at, students(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('notices').select('id, title, priority, is_active, published_at').eq('is_active', true).order('published_at', { ascending: false }).limit(3),
    supabase.from('profiles').select('full_name').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').single(),
    // Students joined this month
    supabase.from('students').select('*', { count: 'exact', head: true })
      .gte('joining_date', `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-01`)
      .lte('joining_date', `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-31`),
    // Students leaving soon (checkout date exists and is in future/recent)
    supabase.from('students').select('*', { count: 'exact', head: true })
      .not('checkout_date', 'is', null)
      .gte('checkout_date', new Date().toISOString().split('T')[0])
  ])

  // Compute stats
  const totalCapacity = (rooms as any[])?.reduce((sum, r) => sum + r.capacity, 0) ?? 0
  const totalOccupied = (rooms as any[])?.reduce((sum, r) => sum + r.occupied_beds, 0) ?? 0
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied)
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const monthlyIncome = (currentMonthBills as any[])?.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0) ?? 0
  const pendingRent = (currentMonthBills as any[])?.reduce((sum, b) => sum + ((b.total_amount ?? 0) - (b.amount_paid ?? 0)), 0) ?? 0
  const totalExpenses = (currentMonthExpenses as any[])?.reduce((sum, e) => sum + (e.amount ?? 0), 0) ?? 0

  const adminName = (profile as { full_name?: string } | null)?.full_name ?? 'Admin'
  const currentMonthName = getMonthName(CURRENT_MONTH)

  function getComplaintBadge(status: string) {
    if (status === 'resolved') return <Badge variant="success">Resolved</Badge>
    if (status === 'in_progress') return <Badge variant="info">In Progress</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  function getBillBadge(status: string) {
    if (status === 'paid') return <Badge variant="success">Paid</Badge>
    if (status === 'partial') return <Badge variant="warning">Partial</Badge>
    return <Badge variant="danger">Pending</Badge>
  }

  function getNoticeBadge(priority: string) {
    if (priority === 'urgent') return <Badge variant="danger">Urgent</Badge>
    if (priority === 'high') return <Badge variant="warning">High</Badge>
    return <Badge variant="default">Normal</Badge>
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {adminName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            GL Hostel Operations Metrics — {currentMonthName} {CURRENT_YEAR}
          </p>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monthly Collections"
          value={formatCurrency(monthlyIncome)}
          subtitle="Received this month"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Pending Rent"
          value={formatCurrency(pendingRent)}
          subtitle="Outstanding this month"
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle="Hostel operational spend"
          icon={TrendingDown}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          subtitle={`${totalOccupied} of ${totalCapacity} beds filled`}
          icon={BedDouble}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Secondary Operation Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Vacant Beds"
          value={totalAvailable}
          subtitle="Ready for assignment"
          icon={DoorOpen}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />
        <StatCard
          title="Joined This Month"
          value={joinedThisMonth ?? 0}
          subtitle="New resident registrations"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Leaving Soon"
          value={leavingSoon ?? 0}
          subtitle="Departures scheduled"
          icon={Clock}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
        />
        <StatCard
          title="Total Rooms"
          value={totalRooms ?? 0}
          subtitle="Configured rooms layout"
          icon={DoorOpen}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Clock className="h-5 w-5 text-gray-400" />
              Recent Billings & Payments
            </CardTitle>
            <a href="/admin/payments" className="text-xs text-blue-600 hover:underline">View all payments</a>
          </CardHeader>
          <CardContent className="p-0">
            {!recentBills || recentBills.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No bills generated yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {(recentBills as any[]).map((bill: any) => {
                  const student = bill.students as { full_name?: string; email?: string } | null
                  const room = bill.rooms as { room_number?: string } | null
                  return (
                    <div key={bill.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{student?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Room {room?.room_number ?? '—'} · {getMonthName(bill.month)} {bill.year}</p>
                      </div>
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-950">{formatCurrency(bill.amount_paid ?? 0)}</p>
                          <p className="text-[10px] text-gray-400">Total: {formatCurrency(bill.total_amount ?? 0)}</p>
                        </div>
                        {getBillBadge(bill.status ?? 'pending')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Notices */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Bell className="h-5 w-5 text-gray-400" />
              Active Notices
            </CardTitle>
            <a href="/admin/notices" className="text-xs text-blue-600 hover:underline">Manage notices</a>
          </CardHeader>
          <CardContent className="p-0">
            {!recentNotices || recentNotices.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No active notices.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {(recentNotices as any[]).map((notice: any) => (
                  <div key={notice.id} className="p-4 hover:bg-gray-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{notice.title}</p>
                      {getNoticeBadge(notice.priority)}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Published {new Date(notice.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <MessageSquare className="h-5 w-5 text-gray-400" />
            Recent Complaints
          </CardTitle>
          <a href="/admin/complaints" className="text-xs text-blue-600 hover:underline">View all complaints</a>
        </CardHeader>
        <CardContent className="p-0">
          {!recentComplaints || recentComplaints.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No complaints registered recently. 🎉</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(recentComplaints as any[]).map((c: any) => {
                const student = c.students as { full_name?: string } | null
                return (
                  <div key={c.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {student?.full_name ?? '—'} · Category: <span className="font-medium uppercase text-gray-600">{c.category}</span> · {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getComplaintBadge(c.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
