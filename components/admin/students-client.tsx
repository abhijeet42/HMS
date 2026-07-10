'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StudentForm from '@/components/admin/student-form'
import { getInitials } from '@/lib/utils'
import type { StudentWithRoom, Room } from '@/types/database'
import { Plus, Search, Pencil, Trash2, Mail, Phone, MapPin, Users, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { deleteStudentUser } from '@/lib/actions/student'
import { syncSupabaseUserToStudent } from '@/lib/actions/sync-user'

interface StudentsClientProps {
  students: StudentWithRoom[]
  rooms: Room[]
}

export default function StudentsClient({ students, rooms }: StudentsClientProps) {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [showForm, setShowForm] = useState(false)
  const [editStudent, setEditStudent] = useState<StudentWithRoom | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Sync Supabase user state
  const [syncEmail, setSyncEmail] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.rooms?.room_number && s.rooms.room_number.includes(search))
      
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchStatus
  })

  async function handleDelete(student: StudentWithRoom) {
    if (!confirm(`Delete student ${student.full_name}? This will remove their login access and all their records.`)) return

    setDeletingId(student.id)
    try {
      const result = await deleteStudentUser(student.id, student.user_id || null)
      if (!result.success) {
        throw new Error(result.error)
      }
      router.refresh()
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(student: StudentWithRoom) {
    setEditStudent(student)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditStudent(null)
  }

  async function handleSyncUser(e: React.FormEvent) {
    e.preventDefault()
    if (!syncEmail.trim()) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncSupabaseUserToStudent(syncEmail.trim())
      if (result.success) {
        setSyncResult({ type: 'success', message: result.message || 'User synced successfully.' })
        setSyncEmail('')
        router.refresh()
      } else {
        setSyncResult({ type: 'error', message: result.error || 'Failed to sync user.' })
      }
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.message || 'Failed to sync user.' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      {/* Modals */}
      {showForm && <StudentForm student={editStudent} rooms={rooms} onClose={closeForm} />}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500">{students.length} registered students</p>
          </div>
          <Button onClick={() => { setEditStudent(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        {/* Sync Supabase User Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Sync Supabase Dashboard User
              </p>
              <p className="text-xs text-blue-600 mt-0.5">If you created a user directly in the Supabase Dashboard, enter their email below to sync them into the students list.</p>
            </div>
            <form onSubmit={handleSyncUser} className="flex gap-2 min-w-0 sm:min-w-[340px]">
              <input
                type="email"
                value={syncEmail}
                onChange={(e) => setSyncEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 h-9 px-3 rounded-md border border-blue-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                required
              />
              <Button type="submit" size="sm" loading={syncing} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                Sync
              </Button>
            </form>
          </div>
          {syncResult && (
            <div className={`mt-3 flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
              syncResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {syncResult.type === 'success' ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              {syncResult.message}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or room..."
              className="w-full pl-9 pr-3 h-9 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'active', 'inactive', 'checked_out'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {s === 'all' ? 'All' : s === 'checked_out' ? 'Checked Out' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Students Table / Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No students found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search or add a new student.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                            {getInitials(student.full_name)}
                          </div>
                          <div>
                            <Link href={`/admin/students/${student.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {student.full_name}
                            </Link>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              {student.college ? student.college : 'No college added'}
                              {student.course && ` • ${student.course}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-xs">{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="text-xs">{student.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {student.rooms ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-medium bg-white">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              Room {student.rooms.room_number}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {student.status === 'active' && <Badge variant="success">Active</Badge>}
                        {student.status === 'inactive' && <Badge variant="warning">Inactive</Badge>}
                        {student.status === 'checked_out' && <Badge variant="default">Checked Out</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(student)} title="Edit Student">
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(student)}
                            loading={deletingId === student.id}
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
