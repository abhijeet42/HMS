// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ExpenseForm from '@/components/admin/expense-form'
import { formatCurrency } from '@/lib/utils'
import { MONTHS, CURRENT_YEAR, CURRENT_MONTH, EXPENSE_CATEGORIES } from '@/lib/constants'
import type { Expense } from '@/types/database'
import { Plus, Search, Pencil, Trash2, Receipt, Filter } from 'lucide-react'

interface ExpensesClientProps {
  expenses: Expense[]
}

export default function ExpensesClient({ expenses }: ExpensesClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState<number>(CURRENT_MONTH)
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR)
  
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter expenses by search, month and year
  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
    
    // Parse expense_date
    const date = new Date(e.expense_date)
    const matchMonth = date.getMonth() + 1 === filterMonth
    const matchYear = date.getFullYear() === filterYear
    
    return matchSearch && matchMonth && matchYear
  })

  const totalExpense = filtered.reduce((sum, e) => sum + e.amount, 0)
  
  // Group by category for summary
  const categoryTotals = EXPENSE_CATEGORIES.map(c => {
    const total = filtered
      .filter(e => e.category === c.value)
      .reduce((sum, e) => sum + e.amount, 0)
    return { ...c, total }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  async function handleDelete(expense: Expense) {
    if (!confirm(`Delete expense "${expense.title}"? This cannot be undone.`)) return

    setDeletingId(expense.id)
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
      if (error) throw error
      router.refresh()
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(expense: Expense) {
    setEditExpense(expense)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditExpense(null)
  }

  return (
    <>
      {showForm && <ExpenseForm expense={editExpense} onClose={closeForm} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500">Track and manage hostel operating costs</p>
          </div>
          <Button onClick={() => { setEditExpense(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {MONTHS.find(m => m.value === filterMonth)?.label} {filterYear}
              </h2>
              <span className="text-sm text-gray-500">{filtered.length} items</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
                <Receipt className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-500">No expenses recorded</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add an expense to start tracking your costs for this month.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs font-medium border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtered.map((expense) => {
                        const catLabel = EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category
                        
                        return (
                          <tr key={expense.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-gray-600">
                              {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{expense.title}</p>
                              {expense.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{expense.notes}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="font-normal bg-white text-gray-600">
                                {catLabel}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => openEdit(expense)} title="Edit">
                                  <Pencil className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(expense)}
                                  loading={deletingId === expense.id}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-900">Total:</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">{formatCurrency(totalExpense)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Category Summary Sidebar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Summary by Category</h3>
            
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">No data to summarize</p>
            ) : (
              <div className="space-y-4">
                {categoryTotals.map(cat => (
                  <div key={cat.value} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{cat.label}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(cat.total / totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-700">{formatCurrency(totalExpense)}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
