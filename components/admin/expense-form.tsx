// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Expense } from '@/types/database'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { X, Receipt } from 'lucide-react'

interface ExpenseFormProps {
  expense?: Expense | null
  onClose: () => void
}

export default function ExpenseForm({ expense, onClose }: ExpenseFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!expense

  const [form, setForm] = useState({
    title: expense?.title ?? '',
    category: expense?.category ?? 'other',
    amount: expense?.amount ?? 0,
    expense_date: expense?.expense_date ?? new Date().toISOString().split('T')[0],
    notes: expense?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Title is required.')
    if (form.amount <= 0) return setError('Amount must be greater than 0.')

    setLoading(true)
    try {
      if (isEdit) {
        const { error: updateErr } = await supabase
          .from('expenses')
          .update({
            title: form.title.trim(),
            category: form.category as Expense['category'],
            amount: Number(form.amount),
            expense_date: form.expense_date,
            notes: form.notes.trim() || null,
          })
          .eq('id', expense.id)

        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('expenses')
          .insert({
            title: form.title.trim(),
            category: form.category as Expense['category'],
            amount: Number(form.amount),
            expense_date: form.expense_date,
            notes: form.notes.trim() || null,
          })

        if (insertErr) throw insertErr
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-500" />
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Title / Description"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Electric Bill May"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={EXPENSE_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
            />
            <Input
              label="Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              min={1}
              step="0.01"
              required
            />
          </div>

          <Input
            label="Expense Date"
            type="date"
            value={form.expense_date}
            onChange={(e) => handleChange('expense_date', e.target.value)}
            required
          />

          <Textarea
            label="Notes (Optional)"
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
            <Button type="submit" className="flex-1" loading={loading}>
              {isEdit ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
