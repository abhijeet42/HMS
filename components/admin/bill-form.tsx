// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MONTHS, CURRENT_YEAR, CURRENT_MONTH } from '@/lib/constants'
import type { StudentWithRoom } from '@/types/database'
import { X, Receipt } from 'lucide-react'

interface BillFormProps {
  students: StudentWithRoom[]
  onClose: () => void
  editBill?: any
  defaultStudentId?: string
}

const INITIAL_FORM = {
  student_id: '',
  month: CURRENT_MONTH,
  year: CURRENT_YEAR,
  base_rent: 0,
  electricity: 0,
  water: 0,
  internet: 0,
  food: 0,
  cleaning: 0,
  laundry: 0,
  maintenance: 0,
  security_deposit: 0,
  previous_due: 0,
  discount: 0,
  other_charges: 0,
  late_fee: 0,
  adjustment: 0,
  other_label: '',
  due_date: '',
  notes: '',
}

export default function BillForm({ students, onClose, editBill, defaultStudentId }: BillFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ 
    ...INITIAL_FORM,
    student_id: defaultStudentId || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editBill) {
      setForm({
        student_id: editBill.student_id ?? '',
        month: editBill.month ?? CURRENT_MONTH,
        year: editBill.year ?? CURRENT_YEAR,
        base_rent: editBill.base_rent ?? 0,
        electricity: editBill.electricity ?? 0,
        water: editBill.water ?? 0,
        internet: editBill.internet ?? 0,
        food: editBill.food ?? 0,
        cleaning: editBill.cleaning ?? 0,
        laundry: editBill.laundry ?? 0,
        maintenance: editBill.maintenance ?? 0,
        security_deposit: editBill.security_deposit ?? 0,
        previous_due: editBill.previous_due ?? 0,
        discount: editBill.discount ?? 0,
        other_charges: editBill.other_charges ?? 0,
        late_fee: editBill.late_fee ?? 0,
        adjustment: editBill.adjustment ?? 0,
        other_label: editBill.other_label ?? '',
        due_date: editBill.due_date ?? '',
        notes: editBill.notes ?? '',
      })
    } else if (defaultStudentId) {
      const studentObj = students.find(s => s.id === defaultStudentId)
      if (studentObj && studentObj.rooms) {
        setForm(prev => ({
          ...prev,
          student_id: defaultStudentId,
          base_rent: studentObj.rooms.monthly_rent ?? 0
        }))
      }
    }
  }, [editBill, defaultStudentId, students])

  // Handle auto-population of rent when student changes in manual select
  useEffect(() => {
    if (!editBill && form.student_id && !defaultStudentId) {
      const studentObj = students.find(s => s.id === form.student_id)
      if (studentObj && studentObj.rooms) {
        setForm(prev => ({
          ...prev,
          base_rent: studentObj.rooms.monthly_rent ?? 0
        }))
      }
    }
  }, [form.student_id, editBill, defaultStudentId, students])

  function handleChange(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Total Rent = Sum of all charges - Discounts
  const total = Math.max(0, (
    Number(form.base_rent || 0) +
    Number(form.electricity || 0) +
    Number(form.water || 0) +
    Number(form.internet || 0) +
    Number(form.food || 0) +
    Number(form.cleaning || 0) +
    Number(form.laundry || 0) +
    Number(form.maintenance || 0) +
    Number(form.security_deposit || 0) +
    Number(form.previous_due || 0) +
    Number(form.other_charges || 0) +
    Number(form.late_fee || 0) +
    Number(form.adjustment || 0)
  ) - Number(form.discount || 0))

  const selectedStudent = students.find((s) => s.id === form.student_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.student_id) return setError('Please select a student.')

    setLoading(true)
    try {
      const payload = {
        student_id: form.student_id,
        room_id: selectedStudent?.room_id ?? null,
        month: Number(form.month),
        year: Number(form.year),
        base_rent: Number(form.base_rent || 0),
        electricity: Number(form.electricity || 0),
        water: Number(form.water || 0),
        internet: Number(form.internet || 0),
        food: Number(form.food || 0),
        cleaning: Number(form.cleaning || 0),
        laundry: Number(form.laundry || 0),
        maintenance: Number(form.maintenance || 0),
        security_deposit: Number(form.security_deposit || 0),
        previous_due: Number(form.previous_due || 0),
        discount: Number(form.discount || 0),
        adjustment: Number(form.adjustment || 0),
        other_charges: Number(form.other_charges || 0),
        late_fee: Number(form.late_fee || 0),
        total_amount: total,
        other_label: form.other_label || null,
        due_date: form.due_date || null,
        notes: form.notes || null,
      }

       if (editBill) {
        const { error: err } = await supabase.from('monthly_bills').update(payload).eq('id', editBill.id)
        if (err) {
          if (err.code === '23505' || err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
            throw new Error('A monthly bill has already been generated for this student in the selected month and year.')
          }
          // If total_amount is still a generated column, retry without it
          if (err.message.includes('non-DEFAULT value') || err.message.includes('total_amount')) {
            const { total_amount, ...retryPayload } = payload
            const { error: retryErr } = await supabase.from('monthly_bills').update(retryPayload).eq('id', editBill.id)
            if (retryErr) {
              if (retryErr.code === '23505' || retryErr.message.includes('duplicate key') || retryErr.message.includes('unique constraint')) {
                throw new Error('A monthly bill has already been generated for this student in the selected month and year.')
              }
              throw retryErr
            }
          } else {
            throw err
          }
        }
      } else {
        const { error: err } = await supabase.from('monthly_bills').insert(payload)
        if (err) {
          if (err.code === '23505' || err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
            throw new Error('A monthly bill has already been generated for this student in the selected month and year.')
          }
          // If total_amount is still a generated column, retry without it
          if (err.message.includes('non-DEFAULT value') || err.message.includes('total_amount')) {
            const { total_amount, ...retryPayload } = payload
            const { error: retryErr } = await supabase.from('monthly_bills').insert(retryPayload)
            if (retryErr) {
              if (retryErr.code === '23505' || retryErr.message.includes('duplicate key') || retryErr.message.includes('unique constraint')) {
                throw new Error('A monthly bill has already been generated for this student in the selected month and year.')
              }
              throw retryErr
            }
          } else {
            throw err
          }
        }
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 overflow-y-auto p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl sm:rounded-xl bg-white shadow-xl sm:my-4 min-h-screen sm:min-h-0">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            {editBill ? 'Edit Bill' : 'Generate Monthly Bill'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student & Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Select
                label="Student *"
                value={form.student_id}
                onChange={(e) => handleChange('student_id', e.target.value)}
                options={students.map((s) => ({ value: s.id, label: `${s.full_name} (Room ${s.rooms?.room_number ?? '—'})` }))}
                required
                disabled={!!defaultStudentId}
              />
            </div>
            <Select
              label="Month *"
              value={form.month}
              onChange={(e) => handleChange('month', Number(e.target.value))}
              options={MONTHS.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Input
              label="Year *"
              type="number"
              value={form.year}
              onChange={(e) => handleChange('year', Number(e.target.value))}
              min={2020}
              max={2100}
            />
          </div>

          {/* Charges */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Charge Components (₹)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Base / Room Rent" type="number" value={form.base_rent} onChange={(e) => handleChange('base_rent', e.target.value)} min={0} />
              <Input label="Electricity" type="number" value={form.electricity} onChange={(e) => handleChange('electricity', e.target.value)} min={0} />
              <Input label="Water" type="number" value={form.water} onChange={(e) => handleChange('water', e.target.value)} min={0} />
              <Input label="Wi-Fi / Internet" type="number" value={form.internet} onChange={(e) => handleChange('internet', e.target.value)} min={0} />
              <Input label="Food / Mess" type="number" value={form.food} onChange={(e) => handleChange('food', e.target.value)} min={0} />
              <Input label="Cleaning" type="number" value={form.cleaning} onChange={(e) => handleChange('cleaning', e.target.value)} min={0} />
              <Input label="Laundry" type="number" value={form.laundry} onChange={(e) => handleChange('laundry', e.target.value)} min={0} />
              <Input label="Maintenance" type="number" value={form.maintenance} onChange={(e) => handleChange('maintenance', e.target.value)} min={0} />
              <Input label="Security Deposit" type="number" value={form.security_deposit} onChange={(e) => handleChange('security_deposit', e.target.value)} min={0} />
              <Input label="Previous Due" type="number" value={form.previous_due} onChange={(e) => handleChange('previous_due', e.target.value)} min={0} />
              <Input label="Discount (-)" type="number" value={form.discount} onChange={(e) => handleChange('discount', e.target.value)} min={0} />
              <Input label="Late Fee / Fine" type="number" value={form.late_fee} onChange={(e) => handleChange('late_fee', e.target.value)} min={0} />
              <Input label="Adjustment (+/-)" type="number" value={form.adjustment} onChange={(e) => handleChange('adjustment', e.target.value)} />
              <Input label="Other Charges" type="number" value={form.other_charges} onChange={(e) => handleChange('other_charges', e.target.value)} min={0} />
              <Input label="Other Label" value={form.other_label} onChange={(e) => handleChange('other_label', e.target.value)} placeholder="e.g. Special Events" />
            </div>
          </div>

          {/* Total */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-blue-900">Total Bill Amount (Auto-Calculated)</span>
            <span className="text-xl font-bold text-blue-700">₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => handleChange('due_date', e.target.value)} />
            <Textarea label="Notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {editBill ? 'Update Bill' : 'Generate Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
