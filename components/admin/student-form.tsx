// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createStudentUser } from '@/lib/actions/student'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Student, Room } from '@/types/database'
import { X, Copy, Check } from 'lucide-react'

interface StudentFormProps {
  student?: Student | null
  rooms: Room[]
  onClose: () => void
}

export default function StudentForm({ student, rooms, onClose }: StudentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!student

  const [form, setForm] = useState({
    full_name: student?.full_name ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    parent_phone: student?.parent_phone ?? '',
    college: student?.college ?? '',
    course: student?.course ?? '',
    room_id: student?.room_id ?? '',
    joining_date: student?.joining_date ?? new Date().toISOString().split('T')[0],
    emergency_contact: student?.emergency_contact ?? '',
    status: student?.status ?? 'active',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ email: string, tempPassword?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const availableRooms = rooms
    .filter(r => r.status !== 'maintenance' && (r.capacity > r.occupied_beds || r.id === student?.room_id))
    .map(r => ({
      value: r.id,
      label: `Room ${r.room_number} (${r.capacity - r.occupied_beds} available)`,
    }))

  function handleChange(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.email.trim()) {
      return setError('Name and email are required.')
    }

    setLoading(true)
    try {
      if (isEdit) {
        // Update existing student
        const { error: updateErr } = await supabase
          .from('students')
          .update({
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            parent_phone: form.parent_phone.trim() || null,
            college: form.college.trim() || null,
            course: form.course.trim() || null,
            room_id: form.room_id || null,
            joining_date: form.joining_date,
            emergency_contact: form.emergency_contact.trim() || null,
            status: form.status as Student['status'],
          })
          .eq('id', student.id)

        if (updateErr) throw updateErr
        
        router.refresh()
        onClose()
      } else {
        // 1. Create auth user securely on the server
        const authResult = await createStudentUser(form.email.trim(), form.full_name.trim())
        
        if (!authResult.success) {
          throw new Error(authResult.error || 'Failed to create auth user')
        }

        // 2. Insert student record
        const { error: insertErr } = await supabase
          .from('students')
          .insert({
            user_id: authResult.userId,
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            parent_phone: form.parent_phone.trim() || null,
            college: form.college.trim() || null,
            course: form.course.trim() || null,
            room_id: form.room_id || null,
            joining_date: form.joining_date,
            emergency_contact: form.emergency_contact.trim() || null,
            status: form.status as Student['status'],
          })

        if (insertErr) {
          // If inserting the student fails, we should ideally rollback the auth user creation
          // (In a production app, we'd want a robust way to handle this, maybe a cron job to clean orphans)
          throw insertErr
        }

        router.refresh()
        
        // Show success screen with temporary password
        setSuccessData({
          email: form.email.trim(),
          tempPassword: authResult.tempPassword
        })
      }
    } catch (err: any) {
      let msg = err.message || 'Something went wrong.'
      if (
        msg.toLowerCase().includes('students_email_key') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('duplicate key value')
      ) {
        msg = 'This email address is already in use by another student. Please use a different email.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function copyCredentials() {
    if (!successData?.tempPassword) return
    const text = `GL Hostel Login Details\nEmail: ${successData.email}\nPassword: ${successData.tempPassword}\n\nPlease change your password after logging in.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Render success screen for new student creation
  if (successData && !isEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Student Created!</h2>
          <p className="text-sm text-gray-500">
            Please share these temporary credentials with the student. They should change their password after logging in.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2 border border-gray-100 relative">
            <p className="text-sm"><span className="font-medium text-gray-700">Email:</span> {successData.email}</p>
            <p className="text-sm"><span className="font-medium text-gray-700">Password:</span> {successData.tempPassword}</p>
            
            <button 
              onClick={copyCredentials}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 bg-white p-1.5 rounded-md border shadow-sm"
              title="Copy credentials"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          
          <Button className="w-full mt-4" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isEdit} // Cannot change email easily in Supabase Auth
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              <Input
                label="Emergency Contact / Parent Phone"
                type="tel"
                value={form.parent_phone}
                onChange={(e) => handleChange('parent_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Academic & Hostel Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="College/University"
                value={form.college}
                onChange={(e) => handleChange('college', e.target.value)}
              />
              <Input
                label="Course/Major"
                value={form.course}
                onChange={(e) => handleChange('course', e.target.value)}
              />
              <Select
                label="Assign Room"
                value={form.room_id}
                onChange={(e) => handleChange('room_id', e.target.value)}
                options={[{ value: '', label: 'Unassigned' }, ...availableRooms]}
              />
              <Input
                label="Joining Date"
                type="date"
                value={form.joining_date}
                onChange={(e) => handleChange('joining_date', e.target.value)}
                required
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Status</h3>
              <Select
                label="Current Status"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={[
                  { value: 'active', label: 'Active (Currently Residing)' },
                  { value: 'inactive', label: 'Inactive (Temporarily Away)' },
                  { value: 'checked_out', label: 'Checked Out (Permanently Left)' },
                ]}
              />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {isEdit ? 'Save Changes' : 'Create Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
