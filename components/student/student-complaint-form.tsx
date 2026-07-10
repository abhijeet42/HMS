// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { COMPLAINT_CATEGORIES } from '@/lib/constants'
import { X, Send } from 'lucide-react'

interface StudentComplaintFormProps {
  studentId: string
  onClose: () => void
}

export default function StudentComplaintForm({ studentId, onClose }: StudentComplaintFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: 'other',
    description: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Please provide a short title.')
    if (!form.description.trim()) return setError('Please describe your issue.')

    setLoading(true)
    try {
      const { error: insertErr } = await supabase
        .from('complaints')
        .insert({
          student_id: studentId,
          title: form.title.trim(),
          category: form.category as any,
          description: form.description.trim(),
        })

      if (insertErr) throw insertErr

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
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-brand-gold" />
            Submit a Complaint
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="What's the issue? (Short Title)"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Fan not working in Room 101"
            required
            autoFocus
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={COMPLAINT_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />

          <Textarea
            label="Details"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Please provide more details so we can fix it quickly..."
            rows={4}
            required
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
              Submit Complaint
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
