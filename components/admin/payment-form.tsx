// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { BillWithStudent } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_MODES, MONTHS } from '@/lib/constants'
import { X, Receipt } from 'lucide-react'

interface PaymentFormProps {
  bill: BillWithStudent
  onClose: () => void
}

export default function PaymentForm({ bill, onClose }: PaymentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const pendingAmount = (bill.total_amount || 0) - (bill.amount_paid || 0)

  const [form, setForm] = useState({
    amount: pendingAmount, // Default to full pending amount
    payment_mode: 'cash',
    transaction_ref: '',
    collected_by: '',
    notes: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.amount <= 0) return setError('Amount must be greater than zero.')
    if (form.amount > pendingAmount) return setError(`Amount cannot exceed the pending balance of ${formatCurrency(pendingAmount)}.`)

    setLoading(true)
    try {
      // 1. Insert payment transaction
      const { error: insertErr } = await supabase
        .from('payment_transactions')
        .insert({
          bill_id: bill.id,
          student_id: bill.student_id,
          amount: Number(form.amount),
          payment_mode: form.payment_mode as 'cash'|'upi'|'bank_transfer'|'other',
          transaction_ref: form.transaction_ref.trim() || null,
          collected_by: form.collected_by.trim() || null,
          notes: form.notes.trim() || null,
        })

      if (insertErr) throw insertErr

      // 2. Update monthly_bill status and amount_paid
      const newAmountPaid = (bill.amount_paid || 0) + Number(form.amount)
      let newStatus = 'partial'
      let paidDate = null
      
      // If paid in full (allowing for small float rounding errors, so we check >=)
      if (newAmountPaid >= (bill.total_amount || 0) - 0.01) {
        newStatus = 'paid'
        paidDate = new Date().toISOString()
      }

      const { error: updateErr } = await supabase
        .from('monthly_bills')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus as 'pending'|'partial'|'paid',
          ...(paidDate ? { paid_date: paidDate } : {})
        })
        .eq('id', bill.id)

      if (updateErr) throw updateErr

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const monthName = MONTHS.find(m => m.value === bill.month)?.label

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 overflow-y-auto">
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-2xl bg-white shadow-xl sm:my-4 max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            Record Payment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Bill Summary */}
        <div className="bg-gray-50 p-4 border-b">
          <p className="text-sm font-medium text-gray-900">{bill.students?.full_name}</p>
          <p className="text-xs text-gray-500 mb-3">{monthName} {bill.year} • Room {bill.rooms?.room_number || 'Unassigned'}</p>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Bill:</span>
            <span className="font-medium text-gray-900">{formatCurrency(bill.total_amount || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-600">Paid So Far:</span>
            <span className="font-medium text-gray-900">{formatCurrency(bill.amount_paid || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t border-gray-200">
            <span className="font-medium text-gray-900">Pending Amount:</span>
            <span className="font-bold text-red-600">{formatCurrency(pendingAmount)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Payment Amount (₹)"
            type="number"
            value={form.amount}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            min={1}
            max={pendingAmount}
            step="0.01"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Mode"
              value={form.payment_mode}
              onChange={(e) => handleChange('payment_mode', e.target.value)}
              options={PAYMENT_MODES.map(m => ({ value: m.value, label: m.label }))}
            />
            <Input
              label="Transaction Ref (Optional)"
              value={form.transaction_ref}
              onChange={(e) => handleChange('transaction_ref', e.target.value)}
              placeholder="e.g. UPI ID"
            />
          </div>

          <Input
            label="Collected By (Optional)"
            value={form.collected_by}
            onChange={(e) => handleChange('collected_by', e.target.value)}
            placeholder="Admin name"
          />

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={2}
          />

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading} disabled={pendingAmount <= 0}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
