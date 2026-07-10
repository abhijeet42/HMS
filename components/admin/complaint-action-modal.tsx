// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ComplaintWithStudent } from '@/types/database'
import { COMPLAINT_STATUSES } from '@/lib/constants'
import { X, Wrench } from 'lucide-react'

interface ComplaintActionModalProps {
  complaint: ComplaintWithStudent
  onClose: () => void
}

export default function ComplaintActionModal({ complaint, onClose }: ComplaintActionModalProps) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    status: complaint.status,
    admin_note: complaint.admin_note ?? '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { error: updateErr } = await supabase
        .from('complaints')
        .update({
          status: form.status as any,
          admin_note: form.admin_note.trim() || null,
        })
        .eq('id', complaint.id)

      if (updateErr) throw updateErr

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 overflow-y-auto">
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-2xl bg-white shadow-xl sm:my-4 max-h-[95dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-gray-500" />
            Update Complaint Status
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-gray-50 p-4 border-b">
          <p className="text-sm font-bold text-gray-900">{complaint.title}</p>
          <p className="text-xs text-gray-500 mt-1">By: {complaint.students?.full_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={COMPLAINT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
          />

          <Textarea
            label="Admin Note (Visible to student)"
            value={form.admin_note}
            onChange={(e) => handleChange('admin_note', e.target.value)}
            placeholder="E.g. Electrician will come tomorrow..."
            rows={3}
          />

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 mt-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Save Updates
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
