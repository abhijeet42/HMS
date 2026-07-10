// @ts-nocheck
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BillForm from '@/components/admin/bill-form'
import PaymentForm from '@/components/admin/payment-form'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getInitials, getBillStatus, getReceiptNumber } from '@/lib/utils'
import { MONTHS, CURRENT_YEAR, CURRENT_MONTH } from '@/lib/constants'
import type { BillWithStudent, StudentWithRoom, PaymentTransaction } from '@/types/database'
import { Plus, Search, Receipt, CreditCard, Pencil, FileText, Filter, ChevronDown, ChevronUp, Banknote, Smartphone, SlidersHorizontal } from 'lucide-react'

interface PaymentsClientProps {
  bills: BillWithStudent[]
  students: StudentWithRoom[]
  transactions: PaymentTransaction[]
}

export default function PaymentsClient({ bills, students, transactions }: PaymentsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loadingPaymentId, setLoadingPaymentId] = useState<string | null>(null)

  async function handleQuickConfirm(bill: BillWithStudent, mode: 'cash' | 'upi') {
    const pendingAmount = (bill.total_amount || 0) - (bill.amount_paid || 0)
    if (pendingAmount <= 0) return

    if (!confirm(`Mark Room ${bill.rooms?.room_number || '—'} rent (${formatCurrency(pendingAmount)}) as fully paid via ${mode.toUpperCase()}?`)) return

    setLoadingPaymentId(bill.id)
    try {
      // 1. Insert payment transaction
      const { error: txErr } = await supabase
        .from('payment_transactions')
        .insert({
          bill_id: bill.id,
          student_id: bill.student_id,
          amount: pendingAmount,
          payment_mode: mode,
          notes: `Quick payment via Admin Dashboard`,
        })

      if (txErr) throw txErr

      // 2. Update monthly_bill
      const { error: billErr } = await supabase
        .from('monthly_bills')
        .update({
          amount_paid: bill.total_amount,
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', bill.id)

      if (billErr) throw billErr

      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.')
    } finally {
      setLoadingPaymentId(null)
    }
  }

  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState<number>(CURRENT_MONTH)
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const [showBillForm, setShowBillForm] = useState(false)
  const [editBill, setEditBill] = useState<BillWithStudent | null>(null)
  
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payBill, setPayBill] = useState<BillWithStudent | null>(null)

  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)

  const filteredBills = bills.filter((b) => {
    const studentName = b.students?.full_name || ''
    const matchSearch = studentName.toLowerCase().includes(search.toLowerCase())
    const matchMonth = b.month === filterMonth
    const matchYear = b.year === filterYear
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    
    return matchSearch && matchMonth && matchYear && matchStatus
  })

  // Summary calculations for filtered view
  const totalExpected = filteredBills.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const totalCollected = filteredBills.reduce((sum, b) => sum + (b.amount_paid || 0), 0)
  const totalPending = totalExpected - totalCollected

  function openEditBill(bill: BillWithStudent) {
    setEditBill(bill)
    setShowBillForm(true)
  }

  function openPayment(bill: BillWithStudent) {
    setPayBill(bill)
    setShowPaymentForm(true)
  }

  function closeForms() {
    setShowBillForm(false)
    setEditBill(null)
    setShowPaymentForm(false)
    setPayBill(null)
  }

  function toggleExpand(billId: string) {
    setExpandedBillId(expandedBillId === billId ? null : billId)
  }

  return (
    <>
      {showBillForm && <BillForm editBill={editBill} students={students} onClose={closeForms} />}
      {showPaymentForm && payBill && <PaymentForm bill={payBill} onClose={closeForms} />}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rent & Payments</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage monthly bills and record payments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setEditBill(null); setShowBillForm(true) }}>
              <Plus className="h-4 w-4" />
              Generate Bill
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Expected</p>
            <p className="text-2xl font-bold text-gray-900 mt-1.5">{formatCurrency(totalExpected)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1.5">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pending</p>
            <p className="text-2xl font-bold text-red-600 mt-1.5">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-400"
              />
            </div>
            
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 cursor-pointer"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 cursor-pointer"
            >
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No bills found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filters or generate new bills.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{minWidth: '680px'}}>
                <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-xs font-semibold border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Due Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.map((bill) => {
                    const statusConfig = getBillStatus(bill.status)
                    const isExpanded = expandedBillId === bill.id
                    const pendingAmount = (bill.total_amount || 0) - (bill.amount_paid || 0)
                    
                    return (
                      <React.Fragment key={bill.id}>
                        <tr className={`transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                                {getInitials(bill.students?.full_name || '?')}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{bill.students?.full_name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Room {bill.rooms?.room_number || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{formatCurrency(bill.total_amount || 0)}</p>
                            {pendingAmount > 0 ? (
                              <p className="text-xs text-red-500 mt-0.5 font-medium">{formatCurrency(pendingAmount)} pending</p>
                            ) : (
                              <p className="text-xs text-green-600 mt-0.5 font-medium">Fully paid</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'}
                            >
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {bill.due_date ? new Date(bill.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {pendingAmount > 0.01 && (
                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleQuickConfirm(bill, 'cash')}
                                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-xs px-2.5 h-8 flex items-center gap-1 shadow-sm touch-manipulation"
                                    disabled={loadingPaymentId === bill.id}
                                    title="Mark as fully paid via cash"
                                  >
                                    <Banknote className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Cash</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleQuickConfirm(bill, 'upi')}
                                    className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium text-xs px-2.5 h-8 flex items-center gap-1 shadow-sm touch-manipulation"
                                    disabled={loadingPaymentId === bill.id}
                                    title="Mark as fully paid via UPI"
                                  >
                                    <Smartphone className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">UPI</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openPayment(bill)}
                                    className="h-8 text-xs font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1 touch-manipulation px-2"
                                    disabled={loadingPaymentId === bill.id}
                                    title="Record a partial or other payment"
                                  >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => openEditBill(bill)} title="Edit Bill" className="h-9 w-9 touch-manipulation">
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => toggleExpand(bill.id)} className="h-9 w-9 touch-manipulation" title={isExpanded ? 'Collapse' : 'Expand details'}>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded details view */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-blue-50/30 p-6 border-b border-gray-200 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                                {/* Bill Breakdown */}
                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bill Breakdown</h4>
                                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 shadow-xs">
                                    {bill.base_rent > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Base Rent</span><span className="font-medium">{formatCurrency(bill.base_rent)}</span></div>}
                                    {bill.electricity > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Electricity</span><span className="font-medium">{formatCurrency(bill.electricity)}</span></div>}
                                    {bill.water > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Water</span><span className="font-medium">{formatCurrency(bill.water)}</span></div>}
                                    {bill.internet > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Internet</span><span className="font-medium">{formatCurrency(bill.internet)}</span></div>}
                                    {bill.food > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Food / Mess</span><span className="font-medium">{formatCurrency(bill.food)}</span></div>}
                                    {bill.cleaning > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Cleaning</span><span className="font-medium">{formatCurrency(bill.cleaning)}</span></div>}
                                    {bill.laundry > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Laundry Extra</span><span className="font-medium">{formatCurrency(bill.laundry)}</span></div>}
                                    {bill.maintenance > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Maintenance</span><span className="font-medium">{formatCurrency(bill.maintenance)}</span></div>}
                                    {bill.security_deposit > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">Security Deposit</span><span className="font-medium">{formatCurrency(bill.security_deposit)}</span></div>}
                                    {bill.previous_due > 0 && <div className="flex justify-between text-sm"><span className="text-red-500">Previous Due</span><span className="font-medium text-red-500">{formatCurrency(bill.previous_due)}</span></div>}
                                    {bill.discount > 0 && <div className="flex justify-between text-sm"><span className="text-green-600">Discount</span><span className="font-medium text-green-600">-{formatCurrency(bill.discount)}</span></div>}
                                    {bill.adjustment !== 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Adjustment</span>
                                        <span className={`font-medium ${bill.adjustment < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                          {bill.adjustment < 0 ? '-' : '+'}{formatCurrency(Math.abs(bill.adjustment))}
                                        </span>
                                      </div>
                                    )}
                                    {bill.other_charges > 0 && <div className="flex justify-between text-sm"><span className="text-gray-600">{bill.other_label || 'Other Charges'}</span><span className="font-medium">{formatCurrency(bill.other_charges)}</span></div>}
                                    {bill.late_fee > 0 && <div className="flex justify-between text-sm"><span className="text-red-500">Late Fee</span><span className="font-medium text-red-500">{formatCurrency(bill.late_fee)}</span></div>}
                                    <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between font-bold text-sm">
                                      <span>Total</span>
                                      <span>{formatCurrency(bill.total_amount || 0)}</span>
                                    </div>
                                    {bill.notes && (
                                      <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800">
                                        <span className="font-bold">Hostel Note:</span> {bill.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Transaction History */}
                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment History</h4>
                                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                                    {transactions.filter(t => t.bill_id === bill.id).length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">No payments recorded yet.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {transactions.filter(t => t.bill_id === bill.id).map(t => (
                                          <div key={t.id} className="flex justify-between text-sm pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                            <div>
                                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                                <span>{formatCurrency(t.amount)}</span>
                                                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono font-bold">
                                                  {getReceiptNumber(t)}
                                                </span>
                                              </p>
                                              <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(t.paid_at).toLocaleDateString()} • {t.payment_mode.toUpperCase()}
                                                {t.transaction_ref && ` • Ref: ${t.transaction_ref}`}
                                              </p>
                                              {t.notes && (
                                                <p className="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded border border-dashed mt-1.5 max-w-xs">
                                                  <span className="font-semibold">Note:</span> {t.notes}
                                                </p>
                                              )}
                                            </div>
                                            {t.collected_by && (
                                              <p className="text-xs text-gray-400">By: {t.collected_by}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}