// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CURRENT_YEAR } from '@/lib/constants'
import { Users, BedDouble, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  // 1. Occupancy Data
  const { data: rooms } = await supabase.from('rooms').select('capacity, occupied_beds')
  const totalBeds = (rooms || []).reduce((sum, r) => sum + r.capacity, 0)
  const occupiedBeds = (rooms || []).reduce((sum, r) => sum + r.occupied_beds, 0)
  const vacantBeds = totalBeds - occupiedBeds
  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0

  // 2. Financial Data (Current Year)
  const { data: bills } = await supabase
    .from('monthly_bills')
    .select('total_amount, amount_paid')
    .eq('year', CURRENT_YEAR)

  const expectedRevenue = (bills || []).reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const collectedRevenue = (bills || []).reduce((sum, b) => sum + (b.amount_paid || 0), 0)
  const pendingDues = expectedRevenue - collectedRevenue

  // 3. Expenses Data (Current Year)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_date')
  
  // Filter for current year manually since expense_date is a date string
  const currentYearExpenses = (expenses || []).filter(e => e.expense_date.startsWith(CURRENT_YEAR.toString()))
  const totalExpenses = currentYearExpenses.reduce((sum, e) => sum + e.amount, 0)
  
  const netProfit = collectedRevenue - totalExpenses

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Overview of hostel performance for {CURRENT_YEAR}</p>
      </div>

      {/* Occupancy Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BedDouble className="h-5 w-5 text-blue-600" />
          Occupancy Report
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Beds</p>
            <p className="text-3xl font-bold text-gray-900">{totalBeds}</p>
          </Card>
          <Card className="p-5 border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Occupied</p>
            <p className="text-3xl font-bold text-blue-600">{occupiedBeds}</p>
          </Card>
          <Card className="p-5 border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Vacant</p>
            <p className="text-3xl font-bold text-green-600">{vacantBeds}</p>
          </Card>
          <Card className="p-5 border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Occupancy Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900">{occupancyRate.toFixed(1)}%</p>
            </div>
            <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Financial Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Financial Overview ({CURRENT_YEAR})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Chart (Simplified as progress bars/stats for now) */}
          <Card className="p-6 border-gray-200 shadow-sm col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium uppercase tracking-wider">Revenue Collected</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(collectedRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Out of {formatCurrency(expectedRevenue)} expected</p>
              </div>
              
              <div className="space-y-2 md:border-l md:border-gray-100 md:pl-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium uppercase tracking-wider">Total Expenses</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">Operating costs for the year</p>
              </div>

              <div className="space-y-2 md:border-l md:border-gray-100 md:pl-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium uppercase tracking-wider">Net (Revenue - Expense)</span>
                </div>
                <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Operational profit/loss</p>
              </div>

            </div>
          </Card>

          {/* Pending Dues Alert Card */}
          <Card className={`p-6 border-l-4 shadow-sm ${pendingDues > 0 ? 'border-l-orange-500 bg-orange-50/30' : 'border-l-green-500 bg-green-50/30'}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">Outstanding Dues</h3>
            <p className={`text-3xl font-bold ${pendingDues > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(pendingDues)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {pendingDues > 0 
                ? 'This is the total amount of rent not yet collected from students for bills generated this year.'
                : 'All generated bills have been fully paid. Great job!'}
            </p>
          </Card>
          
        </div>
      </section>
    </div>
  )
}
