// @ts-nocheck
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getBillStatus, getMonthName } from '@/lib/utils'
import { Receipt, AlertCircle, ChevronDown, ChevronUp, Smartphone, Calendar, TrendingUp } from 'lucide-react'

interface StudentRentClientProps {
  bills: any[]
  payments: any[]
  studentName: string
  upiId: string | null
  hostelName: string
}

export default function StudentRentClient({
  bills,
  payments,
  studentName,
  upiId,
  hostelName
}: StudentRentClientProps) {
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)

  const totalPending = bills.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.amount_paid || 0)), 0)
  const totalPaid = bills.reduce((sum, b) => sum + (b.amount_paid || 0), 0)

  function handlePayUPI(bill: any) {
    if (!upiId) return
    const pendingAmount = (bill.total_amount || 0) - (bill.amount_paid || 0)
    const monthName = getMonthName(bill.month)
    const note = `Rent for ${monthName} ${bill.year} - ${studentName}`
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostelName)}&am=${pendingAmount.toFixed(2)}&tn=${encodeURIComponent(note)}&cu=INR`
    window.open(upiLink, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pending</p>
            <p className={`text-2xl font-bold mt-2 ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Bills</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{bills.length}</p>
          </div>
        </div>
      </div>

      {bills.length === 0 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center">
          <Receipt className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-medium text-gray-900">No bills generated yet</h2>
          <p className="text-sm text-gray-500 mt-1">When the admin generates your monthly rent, it will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const statusConfig = getBillStatus(bill.status)
            const monthName = getMonthName(bill.month)
            const pending = (bill.total_amount || 0) - (bill.amount_paid || 0)
            const isExpanded = expandedBillId === bill.id
            const billPayments = payments.filter(p => p.bill_id === bill.id)

            return (
              <Card key={bill.id} className="overflow-hidden border border-gray-200 shadow-xs">
                <div
                  className="p-5 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {monthName.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{monthName} {bill.year}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Due by {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.color} mb-1`}>
                        {statusConfig.label}
                      </span>
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(bill.total_amount || 0)}</p>
                      {pending > 0 && (
                        <p className="text-[11px] text-red-650 font-bold mt-0.5">
                          Remaining: {formatCurrency(pending)}
                        </p>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 bg-white border-t border-gray-100 space-y-6">
                    {/* Bill Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Complete Rent Breakdown</h4>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Room Rent</span>
                            <span className="font-medium">{formatCurrency(bill.base_rent || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Electricity</span>
                            <span className="font-medium">{formatCurrency(bill.electricity || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Water</span>
                            <span className="font-medium">{formatCurrency(bill.water || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Wi-Fi (Internet)</span>
                            <span className="font-medium">{formatCurrency(bill.internet || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Food / Mess</span>
                            <span className="font-medium">{formatCurrency(bill.food || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Laundry / Cleaning</span>
                            <span className="font-medium">{formatCurrency(bill.cleaning || 0)}</span>
                          </div>
                          {bill.laundry > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Laundry Extra</span>
                              <span className="font-medium">{formatCurrency(bill.laundry)}</span>
                            </div>
                          )}
                          {bill.maintenance > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Maintenance</span>
                              <span className="font-medium">{formatCurrency(bill.maintenance)}</span>
                            </div>
                          )}
                          {bill.security_deposit > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Security Deposit</span>
                              <span className="font-medium">{formatCurrency(bill.security_deposit)}</span>
                            </div>
                          )}
                          {bill.previous_due > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Previous Due</span>
                              <span className="font-medium text-red-500">{formatCurrency(bill.previous_due)}</span>
                            </div>
                          )}
                          {bill.discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Discount</span>
                              <span className="font-medium text-green-600">-{formatCurrency(bill.discount)}</span>
                            </div>
                          )}
                          {bill.adjustment !== 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Adjustment</span>
                              <span className={`font-medium ${bill.adjustment < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                {bill.adjustment < 0 ? '-' : '+'}{formatCurrency(Math.abs(bill.adjustment))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fine / Late Fee</span>
                            <span className="font-medium text-red-500">{formatCurrency(bill.late_fee || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{bill.other_label || 'Other Charges'}</span>
                            <span className="font-medium">{formatCurrency(bill.other_charges || 0)}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                            <span>Total</span>
                            <span>{formatCurrency(bill.total_amount || 0)}</span>
                          </div>
                          {bill.notes && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
                              <span className="font-bold">Hostel Note:</span> {bill.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment History & UPI Options */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payments History</h4>
                          {billPayments.length === 0 ? (
                            <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-4 text-center">No payments recorded for this bill.</p>
                          ) : (
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                              {billPayments.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm pb-2 border-b border-gray-200 last:border-0 last:pb-0">
                                  <div>
                                    <p className="font-semibold text-green-700">{formatCurrency(p.amount)}</p>
                                    <p className="text-xs text-gray-500">via {p.payment_mode.toUpperCase()}</p>
                                    {p.notes && (
                                      <p className="text-[11px] text-gray-600 bg-white p-1 rounded border border-dashed mt-1 max-w-xs">
                                        <span className="font-semibold">Note:</span> {p.notes}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {pending > 0 && (
                          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-blue-800">Pending Amount: {formatCurrency(pending)}</p>
                                {upiId ? (
                                  <p className="text-xs text-blue-600 mt-1">You can pay instantly using UPI or pay at the hostel office.</p>
                                ) : (
                                  <p className="text-xs text-blue-600 mt-1">UPI is not configured. Please pay directly at the hostel office.</p>
                                )}
                              </div>
                            </div>
                            {upiId && (
                              <div className="space-y-2">
                                <Button
                                  onClick={() => handlePayUPI(bill)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                                >
                                  <Smartphone className="h-4 w-4" />
                                  Pay via UPI
                                </Button>
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(upiId)
                                    alert(`UPI ID ${upiId} copied to clipboard!`)
                                  }}
                                  variant="outline"
                                  className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center justify-center gap-2"
                                >
                                  Copy UPI ID: {upiId}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
