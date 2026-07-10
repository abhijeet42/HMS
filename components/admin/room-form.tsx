// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Room } from '@/types/database'
import { X } from 'lucide-react'

interface RoomFormProps {
  room?: Room | null
  onClose: () => void
}

export default function RoomForm({ room, onClose }: RoomFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!room

  const [form, setForm] = useState({
    room_number: room?.room_number ?? '',
    floor: room?.floor ?? 1,
    capacity: room?.capacity ?? 1,
    monthly_rent: room?.monthly_rent ?? 0,
    status: room?.status ?? 'available',
    description: room?.description ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(key: keyof typeof form, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.room_number.trim()) return setError('Room number is required.')
    if (form.capacity < 1) return setError('Capacity must be at least 1.')
    if (form.monthly_rent < 0) return setError('Rent cannot be negative.')

    setLoading(true)
    try {
      if (isEdit) {
        const { error: updateErr } = await supabase
          .from('rooms')
          .update({
            room_number: form.room_number.trim(),
            floor: Number(form.floor),
            capacity: Number(form.capacity),
            monthly_rent: Number(form.monthly_rent),
            status: form.status as Room['status'],
            description: form.description.trim() || null,
          })
          .eq('id', room.id)

        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('rooms')
          .insert({
            room_number: form.room_number.trim(),
            floor: Number(form.floor),
            capacity: Number(form.capacity),
            monthly_rent: Number(form.monthly_rent),
            status: form.status as Room['status'],
            description: form.description.trim() || null,
          })

        if (insertErr) throw insertErr
      }

      router.refresh()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      if (msg.includes('unique') || msg.includes('duplicate')) {
        setError(`Room number "${form.room_number}" already exists.`)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 overflow-y-auto">
      <div className="w-full sm:max-w-md sm:rounded-xl rounded-t-2xl bg-white shadow-xl sm:my-4 max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Number"
              value={form.room_number}
              onChange={(e) => handleChange('room_number', e.target.value)}
              placeholder="e.g. 101"
              required
              id="room-number"
            />
            <Input
              label="Floor"
              type="number"
              value={form.floor}
              onChange={(e) => handleChange('floor', parseInt(e.target.value) || 1)}
              min={1}
              required
              id="room-floor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity (beds)"
              type="number"
              value={form.capacity}
              onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 1)}
              min={1}
              required
              id="room-capacity"
            />
            <Input
              label="Base Rent (₹/month)"
              type="number"
              value={form.monthly_rent}
              onChange={(e) => handleChange('monthly_rent', parseFloat(e.target.value) || 0)}
              min={0}
              required
              id="room-rent"
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'full', label: 'Full' },
              { value: 'maintenance', label: 'Under Maintenance' },
            ]}
            id="room-status"
          />

          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Any notes about this room..."
            rows={2}
            id="room-description"
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
              {isEdit ? 'Save Changes' : 'Add Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
