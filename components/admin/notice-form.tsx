// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Notice } from '@/types/database'
import { NOTICE_PRIORITIES } from '@/lib/constants'
import { X, Bell } from 'lucide-react'

interface NoticeFormProps {
  notice?: Notice | null
  onClose: () => void
}

export default function NoticeForm({ notice, onClose }: NoticeFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!notice

  const [form, setForm] = useState({
    title: notice?.title ?? '',
    content: notice?.content ?? '',
    priority: notice?.priority ?? 'normal',
    is_active: notice?.is_active ?? true,
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Title is required.')
    if (!form.content.trim()) return setError('Content is required.')

    setLoading(true)
    try {
      if (isEdit) {
        const { error: updateErr } = await supabase
          .from('notices')
          .update({
            title: form.title.trim(),
            content: form.content.trim(),
            priority: form.priority as Notice['priority'],
            is_active: form.is_active,
          })
          .eq('id', notice.id)

        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('notices')
          .insert({
            title: form.title.trim(),
            content: form.content.trim(),
            priority: form.priority as Notice['priority'],
            is_active: form.is_active,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 overflow-y-auto">
      <div className="w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl bg-white shadow-xl sm:my-4 max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500" />
            {isEdit ? 'Edit Notice' : 'Publish Notice'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Title / Subject"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Water supply maintenance"
            required
            autoFocus
          />

          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            options={NOTICE_PRIORITIES.map(p => ({ value: p.value, label: p.label }))}
          />

          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Write the full notice content here..."
            rows={5}
            required
          />

          <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
              Active (Visible to students)
            </label>
          </div>

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
              {isEdit ? 'Save Changes' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
